"""Focused CLI regressions for style applicability; no compiler or browser."""
from pathlib import Path
from html import escape
import json
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
CHECKER = ROOT / 'scripts/check-example-style.py'
EX01 = '    (abs(y)>0.5-0.0266666667 \\/ abs(x)>1.5-0.0266666667)? @: true'


def editor(key, source, named=False):
    textarea = '<textarea data-example-id="' + key + '">' if named else '<textarea>'
    return '<section id="example-' + key + '">' + textarea + escape(source) + '</textarea></section>'


class StyleSelection(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='vkf-style-selection-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.preview = self.root / 'public/preview/0.7.5'
        self.preview.mkdir(parents=True)
        (self.root / 'scripts').mkdir()
        shutil.copyfile(CHECKER, self.root / 'scripts/check-example-style.py')
        self.git('init', '-q')
        # Use the real source repository's existing committer, never a guessed identity.
        for key, fmt in [('user.name', '%cn'), ('user.email', '%ce')]:
            value = subprocess.check_output(['git', 'show', '-s', '--format=' + fmt, 'HEAD'], cwd=ROOT, text=True).strip()
            self.assertTrue(value)
            self.git('config', '--local', key, value)
        self.original = {
            'stdlib.html': editor('ex01', EX01),
            'syntax.html': editor('retired', ':: "old listing"', True) + editor('keep', ':: "Hello World"', True),
        }
        for name, text in self.original.items():
            (self.preview / name).write_text(text)
        self.git('add', '.')
        self.git('commit', '-qm', 'Style applicability fixture')
        self.base = self.git('rev-parse', 'HEAD').strip()

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.root, text=True)

    def lint(self, *args):
        return subprocess.run([sys.executable, 'scripts/check-example-style.py', *args], cwd=self.root, text=True, capture_output=True)

    def test_docs_only_does_not_requalify_unchanged_baseline(self):
        # Removing an earlier editor must not make a retained editor look changed.
        (self.preview / 'syntax.html').write_text('<h1>Agreed syntax</h1>' + editor('keep', ':: "Hello World"', True) + '<pre><code>str(2.25,".1")</code></pre>')
        focused = self.lint('--changed-since', self.base)
        self.assertEqual(focused.returncode, 0, focused.stderr)
        report = json.loads(focused.stdout)
        self.assertEqual(report['static_style'], 'NO_CHANGED_TEXTAREA_SOURCES')
        self.assertEqual(report['base_commit'], self.base)
        self.assertEqual(report['textarea_copies'], 0)
        self.assertEqual(report['unchanged_textarea_copies'], 2)
        self.assertEqual(report['full_site_style'], 'NOT_RUN')
        full = self.lint()
        self.assertNotEqual(full.returncode, 0)
        self.assertIn("'binary operator left spacing', '>'", full.stderr)

    def test_changes_on_existing_and_new_pages_cannot_hide(self):
        for name in ['syntax.html', 'stdlib.html', 'new-example.html']:
            with self.subTest(page=name):
                p = self.preview / name
                # The unchanged baseline EX01 body becomes a changed body here.
                source = EX01 if name == 'syntax.html' else ':: f(1,2)'
                p.write_text(editor('keep' if name == 'syntax.html' else 'ex01', source, name == 'syntax.html'))
                result = self.lint('--changed-since', self.base)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(name + ':0', result.stderr)
                self.assertIn('binary operator left spacing' if name == 'syntax.html' else 'comma must be followed by a space', result.stderr)
                if name in self.original:
                    p.write_text(self.original[name])
                else:
                    p.unlink()

    def test_mathematical_spaces_and_literal_fill_survive(self):
        source = 'tight: 6/2x\nloose: 6/2 x\nexplicit: 6/2*x\npower: -2^2\nvalue: x*y + 2x\nfmt: "12> ,4e"\n:: str(value, fmt)\n:: "$(v:12>))"'
        p = self.preview / 'new-example.html'
        p.write_text(editor('math', source))
        before = p.read_bytes()
        result = self.lint('--changed-since', self.base)
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(report['static_style'], 'PASS_CHANGED_TEXTAREA_SOURCES')
        self.assertEqual(report['checked_sources'], ['new-example.html:0'])
        self.assertEqual(p.read_bytes(), before)

    def test_ambiguous_identity_and_missing_base_fail_closed(self):
        (self.preview / 'syntax.html').write_text(editor('keep', ':: "Hello World"', True) + editor('keep', ':: f(1,2)', True))
        result = self.lint('--changed-since', self.base)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('duplicate textarea identity', result.stderr)
        self.assertNotEqual(self.lint('--changed-since', 'missing-style-baseline').returncode, 0)

    def test_default_success_still_checks_the_complete_site(self):
        (self.preview / 'stdlib.html').write_text(editor('ex01', ':: f(1, 2)'))
        result = self.lint()
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(report['scope'], 'full-site-textareas')
        self.assertEqual(report['static_style'], 'PASS')
        self.assertEqual(report['textarea_copies'], 3)


if __name__ == '__main__':
    unittest.main()
