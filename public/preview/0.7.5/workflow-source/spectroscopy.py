import numpy as np
import matplotlib.pyplot as plt

site = np.arange(4, dtype=np.float64)
energy = np.linspace(-1., 1., 257)
profile = 1 / (1 + 100 * energy ** 2)
spectra = 1 + (1 + site[:, None]) * profile[None, :]
contrast = np.ptp(spectra, axis=1)
curve_energy = np.linspace(-1., 1., 513)
selected_site = 2
selected = 1 + (1 + selected_site) / (1 + 100 * curve_energy ** 2)
print(contrast)
print(selected[256])
fig, ax = plt.subplots()
ax.plot(curve_energy, selected, color=(.25, .72, 1., 1.))
ax.set(xlim=(-1, 1), ylim=(0, 5),
       xlabel="Energy coordinate", ylabel="Generated intensity")
plt.show()
