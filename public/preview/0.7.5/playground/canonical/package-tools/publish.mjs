// Explicit remote mutation when called by an authorized actual runner. Source
// workers author this code only. Never writes the default branch or auto-merges.
import {randomUUID} from 'node:crypto';
import {packageBundle} from './host.mjs';
import {githubClient} from './github.mjs';
import {ownerPolicy, authorizePackage} from './ownership.mjs';
import {repository, fail, SHA, canonical} from './metadata.mjs';

export async function publishPackage(packageDir, {repository: repo = 'vektor-flow/libraries', gh = 'gh', api = githubClient(gh)} = {}) {
  repository(repo);
  if (repo.toLowerCase() !== 'vektor-flow/libraries') fail('this uploader targets the existing shared vektor-flow/libraries repository; personal imports need no shared registration');
  const {value, document} = await packageBundle(packageDir), id = value.manifest.name, folder = `packages/${id}`;
  const actor = await api('user'), meta = await api(`repos/${repo}`);
  if (typeof actor?.login !== 'string' || meta.full_name?.toLowerCase() !== repo.toLowerCase() || !meta.permissions?.push || !meta.private) fail('package upload requires authenticated write access to the existing private library repository');
  const branch = meta.default_branch;
  if (typeof branch !== 'string') fail('missing repository default branch');
  const base = await api(`repos/${repo}/branches/${encodeURIComponent(branch)}`), parent = base.commit?.sha;
  if (!SHA.test(parent)) fail('missing current approved source commit');
  const policyFile = await api(`repos/${repo}/contents/.vkf/package-owners.json?ref=${parent}`);
  if (policyFile.type !== 'file' || policyFile.encoding !== 'base64') fail('trusted base ownership policy unavailable');
  const policy = ownerPolicy(JSON.parse(Buffer.from(policyFile.content, 'base64').toString('utf8')));
  authorizePackage(policy, actor.login, id);
  // Read branch protection before writes. Private repositories without supported
  // required checks fail honestly; neither an optional client check nor
  // CODEOWNERS alone provides repository enforcement.
  if (!base.protected) fail('default branch lacks enforced owner policy; maintainer must enable required repository controls');
  const protection = await api(`repos/${repo}/branches/${encodeURIComponent(branch)}/protection`);
  const checks = protection.required_status_checks;
  const ownerCheck = checks?.checks?.find(c => c.context === 'package-ownership' && Number.isSafeInteger(c.app_id) && c.app_id > 0);
  const reviews = protection.required_pull_request_reviews;
  if (!ownerCheck || checks?.strict !== true || !protection.enforce_admins?.enabled ||
      (reviews && !reviews.dismiss_stale_reviews) ||
      (reviews?.bypass_pull_request_allowances?.users?.length ?? 0) || (reviews?.bypass_pull_request_allowances?.teams?.length ?? 0) ||
      (reviews?.bypass_pull_request_allowances?.apps?.length ?? 0)) fail('required app-bound owner check, current review policy and branch protection are not enforced');
  const baseCommit = await api(`repos/${repo}/git/commits/${parent}`), baseTree = baseCommit.tree?.sha;
  if (!SHA.test(baseTree)) fail('missing base source tree');
  // Only replace this package subtree. Removed source files are removed too;
  // other packages and root ownership/workflow files are preserved verbatim.
  const tree = [];
  const sourceFiles = {'vkf.lock': canonical(document) + '\n', ...value.files};
  for (const [name, content] of Object.entries(sourceFiles)) tree.push({path: name, mode: '100644', type: 'blob', content});
  const packageTree = await api(`repos/${repo}/git/trees`, 'POST', {tree});
  if (!SHA.test(packageTree.sha)) fail('invalid uploaded package tree');
  const updated = await api(`repos/${repo}/git/trees`, 'POST', {base_tree: baseTree,
    tree: [{path: folder, mode: '040000', type: 'tree', sha: packageTree.sha}]});
  if (!SHA.test(updated.sha)) fail('invalid uploaded source tree');
  const commit = await api(`repos/${repo}/git/commits`, 'POST', {message: `Update ${id}`, tree: updated.sha, parents: [parent]});
  if (!SHA.test(commit.sha)) fail('invalid source commit');
  const head = `vkf-package/${id}/${randomUUID()}`;
  try { await api(`repos/${repo}/git/refs`, 'POST', {ref: `refs/heads/${head}`, sha: commit.sha}); }
  catch { fail(`source commit ${commit.sha} created; branch ${head} creation was not confirmed; inspect before retrying`); }
  // If the default advances, the PR remains based on the original parent and
  // required up-to-date checks/review handle it; no force/default-branch write.
  try {
    const pr = await api(`repos/${repo}/pulls`, 'POST', {title: `Update ${id}`, head, base: branch,
      body: `Package source upload by @${actor.login}.\n\nPackage: ${id}\nSource commit: ${commit.sha}\nTrusted ownership base: ${parent}\n\nRequires the repository owner check and normal maintainer review. This upload is not a published version until merged into ${branch}.`, maintainer_can_modify: true});
    if (pr.state !== 'open' || pr.merged_at || !Number.isSafeInteger(pr.number) || pr.head?.sha !== commit.sha || pr.base?.ref !== branch ||
        pr.base?.repo?.full_name?.toLowerCase() !== repo.toLowerCase() || pr.html_url !== `https://github.com/${repo}/pull/${pr.number}`) fail('unexpected pull request state');
    return {status: 'PULL_REQUEST_OPEN', published: false, repository: repo, package: id, actor: actor.login,
      sourceCommit: commit.sha, baseCommit: parent, branch: head, pullRequest: pr.number, url: pr.html_url};
  } catch {
    // Retain a recovery pointer, never silently re-push/retry or delete remotely.
    fail(`source branch ${head} at ${commit.sha} exists; PR creation was not confirmed; inspect it before retrying`);
  }
}
