from functools import partial

def calibrate(reading, gain, offset):
    return reading * gain + offset

instrument = partial(calibrate, gain=1.02, offset=-0.3)
print(instrument(20))
print(instrument(25))
