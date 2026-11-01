import {fail, version, range, requirement, canonical, record, project, validateGraph} from './metadata.mjs';

// Resolve declared refs ONCE, then lock full commits. Git chronology implies no
// API compatibility; incompatible compiler/target or diamond pins fail explicitly.
export async function resolve(p, registry, compiler, target) {
  project(p); version(compiler);
  if (!range(p.compiler)(compiler)) fail(`project requires compiler ${p.compiler}`);
  const packages = Object.create(null), resolutions = Object.create(null), pending = Object.entries(p.dependencies);
  let steps = 0;
  while (pending.length) {
    if (++steps > 10000 || Object.keys(packages).length > 256) fail('dependency graph exceeds bounded resolver limit');
    const [id, wanted] = pending.shift(), q = requirement(wanted, id), key = canonical([id, q.ref, q.subdirectory]);
    if (Object.hasOwn(resolutions, key)) continue;
    const r = record(await registry.resolve(id, q), id);
    if (r.source.subdirectory !== q.subdirectory || r.source.repository !== p.registry.repository) fail(`resolved source differs from declared ${id}`);
    resolutions[key] = r.source.commit;
    if (packages[id]) {
      if (canonical(packages[id]) !== canonical(r)) fail(`no jointly compatible Git pins for ${id}; declare one exact commit`);
      continue;
    }
    if (!range(r.package.compiler)(compiler) || !r.package.targets.includes(target)) fail(`${id} incompatible with compiler ${compiler}/target ${target}`);
    packages[id] = r;
    pending.push(...Object.entries(r.package.dependencies));
  }
  return validateGraph({schema: 2, project: p, compiler, target, resolutions,
    packages: Object.fromEntries(Object.entries(packages).sort(([a], [b]) => a.localeCompare(b)))}, p, compiler, target);
}
