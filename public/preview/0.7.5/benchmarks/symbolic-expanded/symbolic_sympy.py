"""Future admitted runner; importing this file does not run a workload."""
import gc
import json
import sys
from time import perf_counter_ns

def kernel(name):
    import sympy as s
    x, y, z = s.symbols('x y z', real=True)
    if name == 'diff-polynomial-16':
        expression = (x + 1)**16 + x**9 + 3*x
        operation = lambda: s.diff(expression, x)
    elif name == 'mixed-partial-6x5':
        expression = x**6*y**5 + 3*x**4*y**3 + x*y
        operation = lambda: s.diff(s.diff(expression, x), y)
    elif name == 'diff-rational':
        expression = (x**2 + 1)/(x + 2)
        operation = lambda: s.diff(expression, x)
    elif name == 'diff-transcendental':
        expression = s.exp(x)*s.sin(x) + s.cos(x**2)
        operation = lambda: s.diff(expression, x)
    elif name == 'substitute-polynomial-12':
        expression = (x + 2)**12 + x**7 - 3*x
        replacement = x + 1
        operation = lambda: expression.subs({x: replacement}, simultaneous=True)
    elif name == 'substitute-transcendental':
        expression = s.exp(x)*s.sin(y) + s.cos(x + y)
        replacement = z + 1
        operation = lambda: expression.subs({x: replacement}, simultaneous=True)
    elif name == 'collect-polynomial-24':
        expression = (x + 1)**24 + (x - 1)**23 + x*(x + 2)**12
        operation = lambda: s.expand(expression)
    elif name == 'shared-dag-derivative-24':
        shared = x**2 + 1
        expression = shared
        for exponent in range(2, 25):
            expression = expression + shared**exponent
        operation = lambda: s.diff(expression, x)
    else:
        raise ValueError('UNRUN unknown symbolic case')
    return s, operation

def main():
    s, operation = kernel(sys.argv[1])
    gc.collect()
    gc.disable()
    try:
        start = perf_counter_ns()
        first = operation()
        first_ms = (perf_counter_ns() - start)/1e6
        start = perf_counter_ns()
        result = operation()
        warm_ms = (perf_counter_ns() - start)/1e6
    finally:
        gc.enable()
    # Serialization and exact normalization are outside both operation clocks.
    print(json.dumps(dict(version=s.__version__, elapsed_ms=warm_ms,
        first_operation_ms=first_ms, output=s.sstr(result), first_output=s.sstr(first))))

if __name__ == '__main__':
    main()
