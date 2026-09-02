import numpy as np

def find_thermocline(depths, temperatures):
    depths = np.array(depths)
    temps = np.array(temperatures)
    grad = np.gradient(temps, depths)
    mask = depths < 500
    if not np.any(mask):
        return 100.0, 0.0
    idx = np.argmin(grad[mask])
    return float(depths[mask][idx]), float(grad[mask][idx])
