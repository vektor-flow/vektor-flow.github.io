from functools import partial

def power(x, n):
    return x ** n

cube = partial(power, n=3)
print(cube(2))
