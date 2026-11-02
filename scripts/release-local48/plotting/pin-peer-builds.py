#!/usr/bin/env python3
"""Later ACTUAL only: read installed peer bytes/normal npm lock, never import them."""
import argparse
import hashlib
import json
from pathlib import Path


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('peer_root', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    expected = json.loads((Path(__file__).parent / 'peers.json').read_text())
    lock_path = args.peer_root / 'package-lock.json'
    lock = json.loads(lock_path.read_text())
    builds = {'lockfile': {'path': str(lock_path.resolve()), 'bytes': lock_path.stat().st_size,
                          'sha256': hashlib.sha256(lock_path.read_bytes()).hexdigest()}}
    for tool, spec in expected.items():
        relative = 'node_modules/' + spec['package']
        package = args.peer_root / relative
        installed = json.loads((package / 'package.json').read_text())
        selected = lock['packages'][relative]
        if installed['version'] != spec['version'] or selected['version'] != spec['version'] or selected['integrity'] != spec['integrity']:
            raise ValueError('exact official peer version/tarball integrity mismatch: ' + tool)
        script = package / spec['script']
        raw = script.read_bytes()
        builds[tool] = {'package': spec['package'], 'version': spec['version'],
                        'integrity': spec['integrity'], 'license': spec['license'],
                        'script': {'path': str(script.resolve()), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}}
    args.output.write_text(json.dumps(builds, indent=2) + '\n')


if __name__ == '__main__':
    main()
