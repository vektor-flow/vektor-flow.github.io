"""Bounded independent exact arithmetic oracle. No CAS imports or product calls.

Polynomials over Q with formal sin/cos/exp atoms; rational equality uses cross
multiplication. Function arguments are canonical polynomials. This proves the
selected identities, not arbitrary transcendental equality or branch rewrites.
"""
import itertools
import json
import math
import re
from fractions import Fraction as Q
from pathlib import Path

LIMIT = 10000

def clean(p):
    p = {k: v for k, v in p.items() if v}
    if len(p) > LIMIT:
        raise ValueError('oracle polynomial term budget')
    return p

def add(a, b):
    p = dict(a)
    for key, value in b.items():
        p[key] = p.get(key, Q(0)) + value
    return clean(p)

def mul(a, b):
    p = {}
    if len(a)*len(b) > 250000:
        raise ValueError('oracle multiplication budget')
    for ka, va in a.items():
        for kb, vb in b.items():
            key = tuple(sorted(ka + kb))
            p[key] = p.get(key, Q(0)) + va*vb
    return clean(p)

ONE = {(): Q(1)}

class Rational:
    def __init__(self, n, d=None):
        self.n, self.d = clean(n), ONE if d is None else clean(d)
        if not self.d:
            raise ValueError('identically zero denominator')
    @classmethod
    def number(cls, n):
        return cls({(): Q(n)})
    @classmethod
    def atom(cls, name):
        return cls({(name,): Q(1)})
    def __add__(self, b):
        return Rational(add(mul(self.n, b.d), mul(b.n, self.d)), mul(self.d, b.d))
    def __neg__(self):
        return Rational({k: -v for k, v in self.n.items()}, self.d)
    def __sub__(self, b):
        return self + -b
    def __mul__(self, b):
        return Rational(mul(self.n, b.n), mul(self.d, b.d))
    def __truediv__(self, b):
        return Rational(mul(self.n, b.d), mul(self.d, b.n))
    def __pow__(self, power):
        if not isinstance(power, int) or abs(power) > 64:
            raise ValueError('bounded integer powers only')
        if power < 0:
            return Rational(self.d, self.n)**(-power)
        result, base = Rational.number(1), self
        while power:
            if power % 2:
                result = result*base
            power //= 2
            if power:
                base = base*base
        return result
    def equals(self, b):
        return mul(self.n, b.d) == mul(b.n, self.d)
    def polynomial(self):
        if set(self.d) != {()}:
            raise ValueError('expected constant polynomial denominator')
        return clean({k: v/self.d[()] for k, v in self.n.items()})

def function(name, argument):
    # No branch-unsafe or approximate numerical simplification.
    key = repr(sorted(argument.polynomial().items()))
    return Rational.atom(name+'('+key+')')

def latex(text):
    text = text.replace('\\left', '').replace('\\right', '')
    def group(i):
        if i >= len(text) or text[i] != '{':
            raise ValueError('expected KaTeX brace')
        start, depth = i + 1, 1
        i += 1
        while i < len(text) and depth:
            depth += (text[i] == '{') - (text[i] == '}')
            i += 1
        if depth:
            raise ValueError('unclosed KaTeX brace')
        return text[start:i-1], i
    out, i = '', 0
    while i < len(text):
        if text.startswith('\\frac', i):
            a, j = group(i + 5)
            b, i = group(j)
            out += '(('+latex(a)+')/('+latex(b)+'))'
        elif text[i] == '\\':
            match = re.match(r'\\(sin|cos|exp)\b', text[i:])
            if not match:
                raise ValueError('unsupported KaTeX function/command')
            out += match[1]
            i += len(match[0])
        else:
            out += {'{': '(', '}': ')'}.get(text[i], text[i])
            i += 1
    return out

TOKEN = re.compile(r'\s*(?:(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)|([A-Za-z_]+)|(\*\*|//|[+*/^()\-]))')

class Parser:
    def __init__(self, text):
        if len(text) > 200000:
            raise ValueError('oracle text budget')
        text = latex(text) if '\\' in text or '{' in text else text
        self.tokens = []
        i = 0
        while i < len(text.rstrip()):
            match = TOKEN.match(text, i)
            if not match:
                raise ValueError('unsupported exact expression token at '+text[i:i+20])
            self.tokens.append(next(s for s in match.groups() if s is not None))
            i = match.end()
        self.i = 0
    def peek(self):
        return self.tokens[self.i] if self.i < len(self.tokens) else None
    def take(self):
        t = self.peek()
        self.i += 1
        return t
    def parse(self, minimum=0):
        t = self.take()
        if t in ['+', '-']:
            left = self.parse(25)
            if t == '-':
                left = -left
        elif t == '(':
            left = self.parse()
            if self.take() != ')':
                raise ValueError('parenthesis')
        elif t in ['sin', 'cos', 'exp']:
            if self.take() != '(':
                raise ValueError('function argument')
            arg = self.parse()
            if self.take() != ')':
                raise ValueError('function parenthesis')
            left = function(t, arg)
        elif t in ['x', 'y', 'z']:
            left = Rational.atom(t)
        elif t and t[0].isdigit():
            if len(t)>30 or ('e' in t.lower() and abs(int(t.lower().split('e')[1]))>16):
                raise ValueError('numeric literal budget')
            q=Q(t)
            if q.denominator!=1 or abs(q)>=2**53:
                raise ValueError('safe exact integer literals only; rational constants use division')
            left = Rational.number(q)
        else:
            raise ValueError('unknown symbol or missing operand')
        while self.peek() is not None and self.peek() != ')':
            op = self.peek()
            implicit = op not in ['+', '-', '*', '/', '//', '^', '**']
            priority = 20 if implicit else {'+': 10, '-': 10, '*': 20, '/': 20, '//': 20, '^': 30, '**': 30}[op]
            if priority < minimum:
                break
            if not implicit:
                self.take()
            right = self.parse(priority if op in ['^', '**'] else priority + 1)
            if implicit or op == '*':
                left = left*right
            elif op == '+':
                left = left+right
            elif op == '-':
                left = left-right
            elif op in ['/', '//']:
                left = left/right
            else:
                value = right.polynomial()
                q = value.get((), Q(0))
                if set(value) - {()} or q.denominator != 1:
                    raise ValueError('noninteger exponent')
                left = left**int(q)
        return left

def exact(text):
    p = Parser(text)
    result = p.parse()
    if p.peek() is not None:
        raise ValueError('trailing expression input')
    return result

def integer(value):
    q = Q(str(value))
    if q.denominator != 1 or abs(q) >= 2**53:
        raise ValueError('exact safe integer coefficient required')
    return int(q)

def coefficient_result(lines, case):
    count = integer(lines[0])
    powers = list(itertools.product(*(range(n+1) for n in case['bounds'])))
    if len(lines) != len(powers) + 1:
        raise ValueError('full coefficient box required')
    p = {}
    for exponents, value in zip(powers, lines[1:]):
        coefficient = integer(value)
        if coefficient:
            monomial = tuple(sorted(v for v, n in zip(case['variables'], exponents) for _ in range(n)))
            p[monomial] = Q(coefficient)
    if count != len(p):
        raise ValueError('terms outside declared coefficient box, or term-count mismatch')
    return Rational(p)

def check_domain(result, case):
    denominator = result.d
    if case['id'] != 'diff-rational':
        if set(denominator) != {()}:
            raise ValueError('unexpected symbolic denominator in total real expression')
        return
    # Rational identity is required on every real x except -2. Reject any
    # additional denominator factor even if it cancels in generic cross-products.
    if any(set(monomial) - {'x'} for monomial in denominator):
        raise ValueError('unexpected denominator variable/function domain')
    coefficients = {len(m): c for m, c in denominator.items()}
    while max(coefficients, default=0) > 0:
        degree = max(coefficients)
        quotient = {}
        remainder = dict(coefficients)
        for n in range(degree, 0, -1):
            leading = remainder.get(n, Q(0))
            if leading:
                quotient[n-1] = leading
                remainder[n] = Q(0)
                remainder[n-1] = remainder.get(n-1, Q(0)) - 2*leading
        if remainder.get(0, Q(0)):
            raise ValueError('new singularities outside x=-2 are not permitted')
        coefficients = {n: c for n, c in quotient.items() if c}

def parse_observation(case, language, stdout):
    expected = exact(case['expected'])
    if language == 'vkf':
        lines = stdout.strip().splitlines()
        warm_ms, first_ms = map(float, lines[:2])
        values = lines[2:]
        if case['bounds'] is None:
            if len(values) != 2:
                raise ValueError('two exact symbolic results required')
            warm, first = map(exact, values)
        else:
            width = math.prod(n+1 for n in case['bounds'])+1
            if len(values) != 2*width:
                raise ValueError('warm/first coefficient inventories required')
            warm = coefficient_result(values[:width], case)
            first = coefficient_result(values[width:], case)
    else:
        if stdout.lstrip().startswith('{'):
            d = json.loads(stdout)
        else:
            d = {}
            for line in stdout.strip().splitlines():
                k, v = line.split('=', 1)
                if k in d:
                    raise ValueError('duplicate runner field')
                d[k] = v
        warm_ms, first_ms = float(d['elapsed_ms']), float(d['first_operation_ms'])
        warm, first = exact(d['output']), exact(d['first_output'])
        version = str(d['version'])
        versions = case['peer_versions']
        if language == 'symengine':
            if version != versions['symengine']:
                raise ValueError('unqualified SymEngine version')
        elif version != versions[language]:
            raise ValueError('unqualified peer version')
        if language == 'symbolics' and str(d.get('julia')) != versions['julia']:
            raise ValueError('unqualified Julia version')
    if not all(math.isfinite(ms) and ms > 0 for ms in [warm_ms, first_ms]):
        raise ValueError('positive distinct operation clocks required')
    check_domain(warm, case)
    check_domain(first, case)
    if not warm.equals(expected) or not first.equals(expected):
        raise ValueError('exact mathematical oracle mismatch')
    return dict(elapsed_ms=warm_ms, first_operation_ms=first_ms, output='EXACT_CONTRACT_MATCH',
                oracle='independent-Q-polynomial/rational/formal-function-ring', engine_passes_added=0)

def relative_gate(cells, peers, limit):
    import statistics
    if not math.isfinite(limit) or limit <= 0 or set(cells) != {'vkf', *peers}:
        raise ValueError('complete peer grid and positive ratio limit required')
    means = {}
    for name, cell in cells.items():
        warm = cell['samples_ms']
        first = cell['first_operation_samples_ms']
        for samples in [warm, first]:
            if len(samples) != 10 or not all(type(v) in (int, float) and math.isfinite(v) and v > 0 for v in samples):
                raise ValueError('ten separate positive first/warm samples required')
        means[name] = statistics.mean(warm)
    ratios = {p: means['vkf']/means[p] for p in peers}
    if any(ratio >= limit for ratio in ratios.values()):
        raise ValueError('strict ratio of arithmetic means failed')
    return dict(means_ms=means, ratios=ratios, first_operation_pooled=False)

if __name__ == '__main__':
    import sys
    request = json.loads(sys.stdin.read() if sys.argv[1]=='--stdin' else Path(sys.argv[1]).read_text())
    if request.get('mode') == 'ratio':
        print(json.dumps(relative_gate(request['cells'], request['peers'], request['limit'])))
    else:
        case = json.loads(Path(request['case']).read_text())
        print(json.dumps(parse_observation(case, request['language'], request['stdout'])))
