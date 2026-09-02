"""
Comparison Service
==================
Computes model-vs-observation statistics for a given Argo profile and
the corresponding model (NetCDF) profile.

Metrics returned
----------------
- RMSE  : root-mean-square error
- Bias  : mean(model - obs)
- r     : Pearson correlation coefficient
- MAE   : mean absolute error
- n     : number of matched depth levels
"""

import numpy as np
from scipy.stats import pearsonr
from app.services.interpolation_service import interpolate_profile_to_depths


def compare_model_argo(
    float_profile: dict,
    model_profile: dict,
    float_id: str,
    variable: str,
) -> dict:
    """
    Compare a single Argo float profile against a model profile.

    Parameters
    ----------
    float_profile : dict  – {depths, temperatures, salinities}
    model_profile : dict  – {depths, temperatures, salinities}
    float_id      : str   – used only for logging
    variable      : str   – 'temperature' or 'salinity'

    Returns
    -------
    dict with keys: rmse, bias, correlation, mae, matchedPoints
    """
    key = "temperatures" if variable == "temperature" else "salinities"

    obs_depths  = np.array(float_profile["depths"],  dtype=float)
    obs_vals    = np.array(float_profile[key],        dtype=float)
    mod_depths  = np.array(model_profile["depths"],   dtype=float)
    mod_vals    = np.array(model_profile[key],         dtype=float)

    # Interpolate model onto Argo depth levels (no extrapolation → NaN)
    mod_interp = interpolate_profile_to_depths(mod_depths, mod_vals, obs_depths)

    # Mask where either is NaN
    mask = ~(np.isnan(obs_vals) | np.isnan(mod_interp))
    n    = int(np.sum(mask))

    if n < 2:
        return {
            "rmse": None, "bias": None, "correlation": None,
            "mae": None,  "matchedPoints": n,
        }

    obs_clean = obs_vals[mask]
    mod_clean = mod_interp[mask]
    diff      = mod_clean - obs_clean

    rmse = float(np.sqrt(np.mean(diff ** 2)))
    bias = float(np.mean(diff))
    mae  = float(np.mean(np.abs(diff)))
    corr = float(pearsonr(mod_clean, obs_clean)[0]) if n >= 3 else None

    return {
        "rmse":         round(rmse, 4),
        "bias":         round(bias, 4),
        "correlation":  round(corr, 4) if corr is not None else None,
        "mae":          round(mae,  4),
        "matchedPoints": n,
    }
