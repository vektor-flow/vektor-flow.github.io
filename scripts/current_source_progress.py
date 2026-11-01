"""Verify the narrow used-resource delta and truthful source-use evidence."""
import hashlib
import json
from collections import Counter
from current_package import need, read, pinned


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode()).hexdigest()


def verify_current_source_progress(preview, release):
    progress = read(pinned(preview, release['current_source_progress']))
    need(progress['fullRequested075Done'] is False and len(progress['requiredRemaining']) == 2, 'full requested release remains incomplete')
    github = read(pinned(preview, progress['realGitHub']))
    need(github['status'] == 'PASS_REAL_PRIVATE_GITHUB_NORMAL_INSTALL_RUN_COMPILE_SINGLE_LOCK', 'real provider evidence')
    # The original actual result has the same normal-provider identity, not a local adapter.
    need(github['consumerUnchangedAcrossNormalOperations'] and github['guestStdout'] == '42\n', 'normal unchanged consumer result')
    lock = github['lock']; records = lock['lock']['sources']
    need(lock['schema'] == 3 and len(records) == len(lock['lock']['requests']) == 1 and records[github['canonicalAddress']] == github['record'], 'single lock graph')
    need(github['compilerBinding'] == release['browser_binding'] and len(github['record']['commit']) == 40 and len(github['record']['tree']) == 40 and len(github['record']['sha256']) == 64, 'remote commit/tree/content binding')
    mapping = progress['mapping']
    for row in mapping['files']: pinned(preview, row)
    folder = preview / 'vf-ui/artifacts/current-labels/native-mapping'
    vectors = read(folder/'vectors.json'); binding = read(folder/'binding.json')
    need(digest({k: vectors['keys'][k] for k in mapping['oldKeys']}) == mapping['oldKeysSHA256'], 'old glyph keys changed')
    need(digest({k: vectors['paths'][k] for k in mapping['oldPaths']}) == mapping['oldPathsSHA256'], 'old physical paths changed')
    need(digest({k: binding['entries'][k] for k in mapping['oldKeys']}) == mapping['oldEntriesSHA256'], 'old font bindings changed')
    need(set(vectors['keys']) - set(mapping['oldKeys']) == set(mapping['addedKeys']) and len(mapping['addedKeys']) == 15, 'used mapping extension')
    need(hashlib.sha256((folder/'fontClosure.json').read_bytes()).hexdigest() == mapping['fontClosureSHA256'] and read(folder/'boxes.json') == {}, 'font closure or empty runtime cache changed')
    layouts = read(pinned(preview, progress['current200Layouts']))
    specs = read(folder/'dataset.json')['specs']; sources = Counter(s['source'] for s in specs)
    need(len(specs) == 10000 and len(sources) == len(layouts['results']) == 200 and layouts['producerClosed'], 'original source population')
    glyphs = rules = 0
    for row in layouts['results']:
        need(row['source'] in sources and row['identity'] == layouts['identity'] and row['box']['complete'] and not row['box']['diagnostics'], 'current producer source/identity/diagnostics')
        for item in row['box']['items']:
            if item['kind'] == 'glyph':
                key = item['key']; entry = binding['entries'][key]
                need(entry['outlineDigest'] == vectors['keys'][key] and vectors['keys'][key] in vectors['paths'], 'used physical glyph binding')
                glyphs += sources[row['source']]
            else:
                need(item['kind'] == 'rule', 'unexpected current layout item')
                rules += sources[row['source']]
    need(glyphs == 34100 and rules == 1000, 'original full layout census')
    failure = read(pinned(preview, progress['original10000']))
    need(failure['full10000Qualified'] is False and failure['actualNormalAttempt']['exit'] == 1 and failure['diagnostic']['code'] == 'NATIVE_SAMPLE_NODE_BUDGET' and failure['unrun'], 'original failure boundary omitted')
    numeric = read(pinned(preview, progress['affectedNumericMath']))
    need(numeric['browserClosed'] and numeric['serverClosed'] and not numeric['pageErrors'] and numeric['result']['labels'] == 3 and numeric['result']['outlineSources'] == 11 and numeric['result']['nonblankPixels'] > 0, 'affected normal numeric math check')
    need(progress['ownerPR']['protected'] is False and all(r['exit'] == 1 and r['response']['status'] == '403' for r in progress['ownerPR']['endpoints']), 'owner enforcement gap omitted')
