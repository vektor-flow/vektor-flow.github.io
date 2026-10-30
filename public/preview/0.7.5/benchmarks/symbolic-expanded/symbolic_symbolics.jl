# Future admitted Symbolics7.31.0 / Julia1.12.6 runner. No package installation.
using Symbolics

function kernel(name)
    @variables x y z
    dx = Differential(x)
    dy = Differential(y)
    derivative(e) = expand_derivatives(dx(e), false)
    if name == "diff-polynomial-16"
        expression = (x + 1)^16 + x^9 + 3*x
        operation = () -> derivative(expression)
    elseif name == "mixed-partial-6x5"
        expression = x^6*y^5 + 3*x^4*y^3 + x*y
        operation = () -> expand_derivatives(dy(derivative(expression)), false)
    elseif name == "diff-rational"
        expression = (x^2 + 1)/(x + 2)
        operation = () -> derivative(expression)
    elseif name == "diff-transcendental"
        expression = exp(x)*sin(x) + cos(x^2)
        operation = () -> derivative(expression)
    elseif name == "substitute-polynomial-12"
        expression = (x + 2)^12 + x^7 - 3*x
        rules = Dict(x => x + 1)
        operation = () -> substitute(expression, rules)
    elseif name == "substitute-transcendental"
        expression = exp(x)*sin(y) + cos(x + y)
        rules = Dict(x => z + 1)
        operation = () -> substitute(expression, rules)
    elseif name == "collect-polynomial-24"
        expression = (x + 1)^24 + (x - 1)^23 + x*(x + 2)^12
        operation = () -> expand(expression)
    elseif name == "shared-dag-derivative-24"
        shared = x^2 + 1
        expression = shared
        for exponent in 2:24
            expression = expression + shared^exponent
        end
        operation = () -> derivative(expression)
    else
        error("UNRUN unknown symbolic case")
    end
    return operation
end

function measured(operation)
    started = time_ns()
    result = operation()
    return (time_ns() - started)/1_000_000, result
end

function main()
    operation = kernel(only(ARGS))
    GC.gc()
    GC.enable(false)
    try
        first_ms, first = measured(operation)
        warm_ms, result = measured(operation)
        println("version=", pkgversion(Symbolics))
        println("julia=", VERSION)
        println("elapsed_ms=", warm_ms)
        println("first_operation_ms=", first_ms)
        println("output=", result)
        println("first_output=", first)
    finally
        GC.enable(true)
    end
end
main()
