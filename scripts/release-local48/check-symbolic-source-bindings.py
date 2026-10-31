#!/usr/bin/env python3
"""Check real selected source command admission without compiling or spawning peers.

Usage: python3 -B check-symbolic-source-bindings.py DRIVER SELECTION BOUND OUTPUT
DRIVER is a fresh complete driver containing the reviewed peer_commands.py.
"""
import copy
import json
import sys
import tempfile
from pathlib import Path

D, selection_path, bound_path, output = map(Path, sys.argv[1:])
sys.path.insert(0, str(D.resolve()))
from bench_protocol import pin, Blocked
from peer_commands import commands
selection = json.loads(selection_path.read_text())
bound = json.loads(bound_path.read_text())
row = next(j['expectation']['rows'][0] for j in bound['jobs']
           if j['id'] == 'preflight.wasm.symbolic.diff-polynomial-16')
tools = selection['tools']
variants = selection['peer_source_variants']
checks = []

def rejected(label, row_arg=row, tools_arg=None, variants_arg=None):
    try:
        commands(row_arg, 'symengine', tools if tools_arg is None else tools_arg,
                 '/tmp/unused-symbolic-command-control',
                 variants if variants_arg is None else variants_arg)
    except (Blocked, ValueError, AssertionError, RuntimeError, FileNotFoundError) as error:
        checks.append(dict(check=label, rejected=True, error=str(error)))
    else:
        raise AssertionError('unexpected admission: ' + label)

for language in ['symengine', 'sympy', 'symbolics']:
    command = commands(row, language, tools, '/tmp/unused-symbolic-command-control', variants)
    original = next(p for p in row['peer_source_pins']
                    if Path(p['path']).name.startswith('symbolic_' + language + '.'))
    expected = variants[language]['adapted'] if language in variants else original
    if language == 'symengine':
        assert command['run'] == [tools['symengine-e1201']['path'], row['workload']]
        assert tools['symengine-e1201']['source'] == expected
    else:
        assert expected['path'] in command['run']
    checks.append(dict(check='selected-' + language, admitted=True, selectedSource=expected,
                       argv=command['run'], peerSpawned=False))

bad = copy.deepcopy(variants);bad['symengine']['original']['path'] += '.wrong'
rejected('different-original-path', variants_arg=bad)
bad = copy.deepcopy(variants);bad['symengine']['adapted']['sha256'] = '0' * 64
rejected('modified-adapted-pin', variants_arg=bad)
rejected('missing-adapter', variants_arg={})
bad = copy.deepcopy(tools);bad['symengine-e1201']['source'] = variants['symengine']['original']
rejected('wrong-binary-selected-source', tools_arg=bad)
bad = copy.deepcopy(tools);bad['symengine-e1201']['original_build_source'] = variants['symengine']['adapted']
rejected('wrong-original-build-path', tools_arg=bad)
badrow = copy.deepcopy(row);badrow['peer_source_pins'] += [variants['symengine']['original']]
rejected('ambiguous-original-source', row_arg=badrow)
with tempfile.TemporaryDirectory(prefix='vkf-symbolic-source-control-') as tmp:
    # Validly pinned modified bytes must still fail the semantic alpha-renaming guard.
    p = Path(tmp) / 'symbolic_symengine.cpp'
    p.write_bytes(Path(variants['symengine']['adapted']['path']).read_bytes() + b'\n// changed algorithm\n')
    bad = copy.deepcopy(variants);bad['symengine']['adapted'] = pin(p)
    rejected('valid-pin-arbitrary-source-change', variants_arg=bad)
    # Repeated source identities remain path-exact, even for byte-identical copies.
    p.write_bytes(Path(variants['symengine']['adapted']['path']).read_bytes())
    bad = copy.deepcopy(variants);bad['symengine']['adapted'] = pin(p)
    rejected('same-bytes-unbound-binary-source-path', variants_arg=bad)
assert len(checks) == 11
output.write_text(json.dumps(dict(status='PASS_SOURCE_COMMAND_ADMISSION_CONTROLS_ONLY',
                                driver=pin(D / 'peer_commands.py'), checks=checks,
                                peerProcessesSpawned=0, productQualification=False), indent=2) + '\n')
print('PASS 3 real selected peer commands and 8 rejection controls; no peer execution')
