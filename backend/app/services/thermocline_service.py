"""
Thermocline Service
===================
Detects the thermocline depth from a vertical temperature profile.

The thermocline is identified as the depth with the steepest negative
temperature gradient (strongest d T/d z in the upper 500 m).
"""

import numpy as np


def find_thermocline(profile: dict) -> dict:
    """
    Parameters
    ----------
    profile : dict  – must contain 'depths' and 'temperatures' keys
                      (as returned by NetCDFService.get_profile or
                       ArgoService.get_profile)

    Returns
    -------
    dict with 'depth' (m) and 'gradient' (°C/m)
    """
    depths = np.array(profile.get("depths", []), dtype=float)
    temps  = np.array(profile.get("temperatures", []), dtype=float)

    if len(depths) < 3:
        return {"depth": 100.0, "gradient": 0.0}

    # Restrict to upper 500 m
    mask = depths < 500
    if not np.any(mask):
        mask = np.ones(len(depths), dtype=bool)

    d = depths[mask]
    t = temps[mask]

    # Remove NaNs
    valid = ~(np.isnan(d) | np.isnan(t))
    d, t = d[valid], t[valid]
    if len(d) < 2:
        return {"depth": 100.0, "gradient": 0.0}

    grad = np.gradient(t, d)
    idx  = int(np.argmin(grad))   # most negative gradient

    return {
        "depth":    float(d[idx]),
        "gradient": float(grad[idx]),
    }
