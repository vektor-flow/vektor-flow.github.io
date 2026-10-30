// Future admitted build only. SymEngine API capability/version must be receipted.
#include <symengine/add.h>
#include <symengine/mul.h>
#include <symengine/pow.h>
#include <symengine/functions.h>
#include <symengine/symbol.h>
#include <symengine/integer.h>
#include <symengine/symengine_config.h>
#include <chrono>
#include <functional>
#include <iostream>
#include <stdexcept>
#include <string>
using namespace SymEngine;
using BenchmarkExpr = RCP<const Basic>;
BenchmarkExpr benchmarkInteger(int n) { return integer(n); }
BenchmarkExpr P(const BenchmarkExpr& e, int n) { return pow(e, benchmarkInteger(n)); }
std::function<BenchmarkExpr()> kernel(const std::string& name)
{
    auto x = symbol("x"), y = symbol("y"), z = symbol("z");
    BenchmarkExpr e;
    if (name == "diff-polynomial-16")
        e = add(add(P(add(x, benchmarkInteger(1)), 16), P(x, 9)), mul(benchmarkInteger(3), x));
    else if (name == "mixed-partial-6x5") {
        e = add(add(mul(P(x, 6), P(y, 5)), mul(benchmarkInteger(3), mul(P(x, 4), P(y, 3)))), mul(x, y));
        return [=] { return e->diff(x)->diff(y); };
    } else if (name == "diff-rational")
        e = div(add(P(x, 2), benchmarkInteger(1)), add(x, benchmarkInteger(2)));
    else if (name == "diff-transcendental")
        e = add(mul(exp(x), sin(x)), cos(P(x, 2)));
    else if (name == "substitute-polynomial-12") {
        e = sub(add(P(add(x, benchmarkInteger(2)), 12), P(x, 7)), mul(benchmarkInteger(3), x));
        map_basic_basic rules{{x, add(x, benchmarkInteger(1))}};
        return [=] { return e->subs(rules); };
    } else if (name == "substitute-transcendental") {
        e = add(mul(exp(x), sin(y)), cos(add(x, y)));
        map_basic_basic rules{{x, add(z, benchmarkInteger(1))}};
        return [=] { return e->subs(rules); };
    } else if (name == "collect-polynomial-24") {
        e = add(add(P(add(x, benchmarkInteger(1)), 24), P(sub(x, benchmarkInteger(1)), 23)), mul(x, P(add(x, benchmarkInteger(2)), 12)));
        return [=] { return expand(e); };
    } else if (name == "shared-dag-derivative-24") {
        BenchmarkExpr shared = add(P(x, 2), benchmarkInteger(1));
        e = shared;
        for (int k = 2; k <= 24; ++k) e = add(e, P(shared, k));
    } else throw std::runtime_error("UNRUN unknown symbolic case");
    return [=] { return e->diff(x); };
}
int main(int argc, char** argv)
{
    if (argc != 2) return 2;
    if (std::string(argv[1]) == "--version") {
        std::cout << "symengine=" << SYMENGINE_VERSION << '\n';
        return 0;
    }
    auto operation = kernel(argv[1]);
    const auto first_started = std::chrono::steady_clock::now();
    BenchmarkExpr first = operation();
    const auto first_ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - first_started).count();
    const auto warm_started = std::chrono::steady_clock::now();
    BenchmarkExpr result = operation();
    const auto warm_ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - warm_started).count();
    std::cout.precision(17);
    std::cout << "version=" << SYMENGINE_VERSION << '\n'
              << "elapsed_ms=" << warm_ms << '\n'
              << "first_operation_ms=" << first_ms << '\n'
              << "output=" << *result << '\n'
              << "first_output=" << *first << '\n';
}
