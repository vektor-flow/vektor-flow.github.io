#!/usr/bin/env python3
"""ACTUAL-only data assembly for the existing LOCAL48 selection schema.

Copies selected artifacts, writes METADATA_ONLY source/ABI descriptions, and
records explicit dependencies. Runs no product, tool probe, benchmark or build.
Source authoring/review must not execute/import/syntax-check this script.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

RECIPE = Path('/mnt/development/VektorFlow-e1566-20261030/CURRENT-SIX-COMPONENT-RECIPE.json')


def need(ok, message):
    if not ok:
        raise ValueError(message)


def read(path):
    return json.loads(Path(path).read_bytes())


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()


def pin(path):
    path = Path(path).resolve(strict=True)
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            h.update(block)
    return dict(path=str(path), bytes=path.stat().st_size, sha256=h.hexdigest())


def verify(spec):
    need(pin(spec['path']) == {k: spec[k] for k in ('path', 'bytes', 'sha256')},
         'changed/missing source artifact: ' + spec['path'])
    return Path(spec['path'])


def write(path, value):
    need(not path.exists(), 'fresh metadata path required: ' + str(path))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')
    return pin(path)


def copy(spec, destination):
    source = verify(spec)
    need(not destination.exists(), 'fresh artifact destination required')
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    shutil.copymode(source, destination)
    result = pin(destination)
    need(result['bytes'] == spec['bytes'] and result['sha256'] == spec['sha256'],
         'copy changed selected bytes')
    return result


def main(root, output, restored_path, recipe_path=RECIPE):
    root, output = root.resolve(strict=True), output.resolve()
    need(output.is_relative_to(root), 'selection data must belong to actual root')
    need(not output.exists(), 'fresh append-only selection output required')
    recipe = read(recipe_path)
    template = read(verify(recipe['original_template']))
    roles = recipe['components']
    output.mkdir(parents=True)
    metadata = output / 'metadata'
    package = output / 'native-package'
    components = {}
    dependency_specs = [pin(recipe_path), recipe['original_template']]
    historical_package = Path(template['native_package'])

    def component(name, binding, files, origins, bindings, evidence, config, installs):
        for item in evidence:
            verify(item)
        source = write(metadata / (name + '.source.json'), dict(
            schema='vkf-component-source-manifest-v1',
            component_source_binding=binding,
            file_source_bindings=bindings, file_origins=origins,
            evidence=evidence, qualification='METADATA_ONLY_NO_NEW_EXECUTION'))
        abi = write(metadata / (name + '.abi.json'), dict(
            source_binding=binding,
            files={p['path']: p['sha256'] for p in files}, evidence=evidence,
            qualification='METADATA_ONLY_NO_NEW_EXECUTION'))
        components[name] = dict(source_binding=binding, files=files,
                                installs=installs, evidence=evidence,
                                source_manifest=source, abi=abi, config=config)
        dependency_specs.extend(evidence + [source, abi, config])

    restored = read(restored_path)
    dependency_specs.append(pin(restored_path))
    native = Path(restored['native_package'])
    current_native_binding = restored['native_binding']
    cli_origin = restored['native_cli']
    cli_file = copy(cli_origin, package / 'bin/vkf-0.7.5')
    native_evidence = restored['native_evidence']
    component('linux-cli', current_native_binding, [cli_file],
              {cli_file['path']: cli_origin}, {cli_file['path']: current_native_binding},
              native_evidence, native_evidence[0], ['bin/vkf-0.7.5'])

    for name in ('linux-helper', 'native-runtime'):
        old = roles[name]['unchanged_component_template']
        source = read(verify(old['source_manifest']))
        verify(old['abi'])
        files, origins, bindings, installs = [], {}, {}, []
        need(len(old['files']) == len(old['installs']), 'complete native install mapping')
        for historical, relative in zip(old['files'], old['installs']):
            relative = Path(relative)
            need(not relative.is_absolute() and '..' not in relative.parts, 'native install path')
            candidate = native / relative
            # Current stdlib comes from the same selected native package as CLI.
            # Existing Linux helper/DSOs remain separately pinned components.
            use_current = relative.parts[0] == 'compiler'
            original = pin(candidate) if use_current else historical
            if use_current:
                need(str(relative) in restored['native_runtime_files'], 'unlisted current native source file')
                need(original == restored['native_runtime_files'][str(relative)], 'native runtime source changed')
            result = copy(original, package / relative)
            files.append(result); origins[result['path']] = original
            bindings[result['path']] = restored.get('native_library_binding', current_native_binding) if use_current else source['file_source_bindings'][historical['path']]
            installs.append(str(relative))
        # Include current stdlib additions as well as updated historical paths.
        # Omitting these would assemble a partial library tree for the new CLI.
        if name == 'native-runtime':
            for relative, original in sorted(restored['native_runtime_files'].items()):
                relative = Path(relative)
                need(not relative.is_absolute() and '..' not in relative.parts and
                     relative.parts[0] == 'compiler', 'current native source path')
                if str(relative) in installs:
                    continue
                need(pin(native / relative) == original, 'current native source changed')
                result = copy(original, package / relative)
                files.append(result); origins[result['path']] = original
                bindings[result['path']] = restored.get('native_library_binding', current_native_binding)
                installs.append(str(relative))
        config = write(metadata / (name + '.config.json'), dict(
            status='EXACT_CURRENT_COMPONENT_DATA_COMPATIBILITY_UNRUN',
            original_config=old['config'], original_source=old['source_manifest'],
            original_abi=old['abi'], files=files, current_cli=cli_file,
            global_pass_inherited=False))
        binding = ('native-files:' + hashlib.sha256(canonical(bindings)).hexdigest()) if name == 'native-runtime' else old['source_binding']
        component(name, binding, files, origins, bindings,
                  old['evidence'] + [old['source_manifest'], old['abi']] + native_evidence, config, installs)

    site = root / 'site'
    preview = site / 'public/preview/0.7.5'
    release_pin = pin(preview / 'current-compiler-release.json')
    release = read(release_pin['path'])
    frontend, formatter = release['frontend_binding'], release['formatter_binding']
    need(release['compiler_source'] == restored['wasm_binding'] and frontend == restored['wasm_binding'],
         'exact current WASM source binding')
    node_files = []
    node_origins = {}
    for name in restored['canonical_names']:
        original = restored['canonical_files'][name]
        actual = pin(preview / 'playground/canonical' / name)
        need(actual['sha256'] == original['sha256'] and actual['bytes'] == original['bytes'],
             'changed current ESM package input: ' + name)
        node_files.append(actual); node_origins[actual['path']] = original
    bindings = {p['path']: restored.get('canonical_file_bindings', {}).get(
        str(Path(p['path']).relative_to(preview / 'playground/canonical')),
        formatter if Path(p['path']).name.startswith('formatter') else frontend) for p in node_files}
    evidence = [release_pin] + restored['canonical_evidence']
    component('node', frontend, node_files, node_origins, bindings, evidence, release_pin,
              ['node/' + str(Path(p['path']).relative_to(preview / 'playground/canonical')) for p in node_files])
    components['node'].update(package_source_binding=release['compiler_source'], formatter_source_binding=formatter)
    browser_files = node_files + [pin(preview / 'playground/canonical/package.json')]
    browser_bindings = dict(bindings, **{browser_files[-1]['path']: release['compiler_source']})
    component('browser', release['compiler_source'], browser_files,
              {p['path']: p for p in browser_files}, browser_bindings, evidence,
              release_pin, ['browser/' + str(Path(p['path']).relative_to(preview / 'playground/canonical')) for p in browser_files])

    # Bind every current075 public file, including final native kernel assets
    # when present. A later build/edit changes these pins and needs a fresh
    # assembly directory; this is no assertion that missing assets are qualified.
    site_paths = sorted(p for p in preview.rglob('*') if p.is_file())
    site_paths.append(site / 'public/DEPLOYMENT-MANIFEST.json')
    site_files = [pin(p) for p in site_paths]
    site_binding = 'site-tree:' + hashlib.sha256(canonical([
        dict(path=str(Path(p['path']).relative_to(site)), sha256=p['sha256'], bytes=p['bytes'])
        for p in site_files])).hexdigest()
    site_evidence = [release_pin, pin(site / 'public/DEPLOYMENT-MANIFEST.json')]
    kernel_descriptor = preview / 'previews/gpu-math-typing/native-kernels/current.json'
    if kernel_descriptor.exists():
        site_evidence.append(pin(kernel_descriptor))
        for build in sorted(kernel_descriptor.parent.glob('*/build.json')):
            site_evidence.append(pin(build))
    site_config = write(metadata / 'site.config.json', dict(
        qualification='CURRENT_SITE_BYTES_ONLY_NO_NEW_EXECUTION',
        source_root=str(site), source_binding=site_binding, current_release=release_pin,
        current075_file_count=len(site_files), global_pass_inherited=False))
    component('site', site_binding, site_files, {p['path']: p for p in site_files},
              {p['path']: 'site-file:' + p['sha256'] for p in site_files},
              site_evidence, site_config,
              [str(Path(p['path']).relative_to(site)) for p in site_files])

    driver = root / 'local48-source'
    need((driver / 'overnight.py').is_file() and (driver / 'actual-peer32.py').is_file(),
         'own complete existing driver directory required')
    driver_inputs = [pin(p) for p in sorted(driver.rglob('*'))
                     if p.is_file() and p.suffix in ('.py', '.mjs', '.json', '.cpp', '.jl')]
    # Six existing maintained host inputs, copied together in the complete driver.
    host_names = dict(consumer='web/vf-ui/vf-emitted-program-consumer.mjs',
                      diagnostic='diagnostic-codec.mjs', codec='runtime-value-codec.mjs',
                      capabilities='program-capabilities.mjs', concurrent='node-concurrent.mjs',
                      documents='immutable-host-documents.mjs')
    node_host = {key: pin(driver / 'host' / name) for key, name in host_names.items()}
    dependency_specs.extend(node_host.values())
    dependency_specs.extend(driver_inputs)
    compatibility = write(metadata / 'source-compatibility.json', dict(
        components={name: hashlib.sha256(canonical(value)).hexdigest()
                    for name, value in components.items()},
        dependencies=list({p['path']: p for p in dependency_specs}.values()),
        global_pass_inherited=False,
        scope='Exact selected files and genuine source/dependency origins only. '
              'Current cross-component ABI/target compatibility is UNRUN; '
              'requires ALL fresh original preflight/parity before timing.'))
    selection = dict(template)
    selection.update(components=components, compatibility=compatibility,
                     driver_inputs=driver_inputs, native_package=str(package),
                     tools={}, tool_candidates=restored['tool_candidates'], installed_peer_receipts={}, node_host=node_host,
                     retained_peer_selection=restored['retained_peer_selection'],
                     restored_dependency_inventory=restored['symbolic_mapping'],
                     restored_julia_inventory=restored['julia_inventory'],
                     peer_source_variants=restored['peer_source_variants'],
                     symbolic_stdlib_source=pin(package / 'compiler/self_hosted/stdlib/symbolic.vkf'),
                     status='METADATA_ONLY_CURRENT_SELECTION_ACTUAL_PREFLIGHT_UNRUN',
                     performance_claim=False, global_pass_inherited=False)
    result = write(output / 'selection.json', selection)
    print(json.dumps(dict(status='METADATA_ONLY_NO_NEW_EXECUTION', selection=result,
                          prerequisite_setup='Original missing tools/compiled peers/environment '
                                             'remain UNRUN. No all-preflight/parity bypass.')))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--restored', type=Path, required=True,
                        help='Exact current native/WASM/peer prerequisite data; no historical default')
    parser.add_argument('--recipe', type=Path, default=RECIPE)
    args = parser.parse_args()
    main(args.root, args.output or args.root / 'local48-selection', args.restored, args.recipe)
