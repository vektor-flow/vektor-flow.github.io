// Readback oracle for the minimal trusted-maintainer PR route. This is a client
// preflight, not a replacement for GitHub enforcing these controls on main.
// No Actions job/status, CODEOWNERS file or unsigned author is an owner ACL.
import {ownerPolicy} from './ownership.mjs';
import {fail} from './metadata.mjs';
export function requireMaintainerPRProtection(policy, protection) {
  ownerPolicy(policy);
  const reviews = protection?.required_pull_request_reviews, restrictions = protection?.restrictions;
  if (protection?.enforce_admins?.enabled !== true || !reviews ||
      !Number.isInteger(reviews.required_approving_review_count) || reviews.required_approving_review_count < 0 ||
      reviews.dismiss_stale_reviews !== true ||
      protection.allow_force_pushes?.enabled !== false || protection.allow_deletions?.enabled !== false) {
    fail('main must enforce PR requirements, stale-review dismissal and no force/deletion, including administrators');
  }
  const bypass = reviews.bypass_pull_request_allowances;
  for (const kind of ['users', 'teams', 'apps']) {
    if (bypass?.[kind] !== undefined && (!Array.isArray(bypass[kind]) || bypass[kind].length)) fail('main PR bypass allowances are forbidden');
  }
  const allowed = new Set(policy.maintainers.map(v => v.toLowerCase()));
  if (!restrictions || !Array.isArray(restrictions.users) || !restrictions.users.length ||
      !Array.isArray(restrictions.teams) || restrictions.teams.length ||
      !Array.isArray(restrictions.apps) || restrictions.apps.length ||
      !restrictions.users.every(v => typeof v?.login === 'string' && allowed.has(v.login.toLowerCase()))) {
    fail('main push/merge restrictions must contain only trusted policy maintainers, with no teams/apps');
  }
  const contexts = [...(protection.required_status_checks?.contexts ?? []),
    ...(protection.required_status_checks?.checks ?? []).map(v => v.context)];
  if (contexts.some(v => ['package-ownership', 'Package ownership advisory', 'inspect-owner'].includes(v))) {
    fail('remove legacy/advisory ownership status from required checks; use server maintainer merge restrictions');
  }
  return {route: 'TRUSTED_MAINTAINER_PR', mergeActors: restrictions.users.map(v => v.login)};
}
