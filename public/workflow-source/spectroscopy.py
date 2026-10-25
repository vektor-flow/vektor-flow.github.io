import numpy as np
import matplotlib.pyplot as plt

energy = np.array([-1., 0., 1.], dtype=np.float64)
spectra = np.array([[1., 5., 2.], [2., 3., 4.],
                    [3., 8., 4.], [4., 5., 6.]], dtype=np.float64)

contrast = np.ptp(spectra, axis=1)
selected = spectra[2, :]
print(contrast)
print(selected)
fig, ax = plt.subplots(dpi=96)
ax.plot(energy, selected, color=(.25, .72, 1., 1.), linewidth=.75)
ax.set(xlim=(-1, 1), ylim=(0, 10))
plt.show()
