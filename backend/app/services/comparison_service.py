import numpy as np
from scipy.interpolate import interp1d
import random

# Mock Argo Data (Simulates real profiles)
ARGO_DB = {
    "ARGO-1": {
        "lat": 15.0, "lon": 85.0,
        "depths": [0, 10, 25, 50, 100, 200, 500],
        "temp": [29.5, 29.2, 28.5, 27.0, 24.5, 20.0, 15.0],
        "salt": [36.8, 36.5, 36.0, 35.5, 34.8, 34.2, 34.0]
    },
    "ARGO-2": {
        "lat": 12.0, "lon": 82.0,
        "depths": [0, 10, 25, 50, 100, 200, 500],
        "temp": [28.8, 28.5, 27.8, 26.5, 24.0, 19.5, 14.0],
        "salt": [35.6, 35.4, 35.0, 34.7, 34.2, 33.8, 33.5]
    },
    "ARGO-3": None,  # Simulates failure
    "ARGO-4": {
        "lat": 22.0, "lon": 85.0,
        "depths": [0, 10, 25, 50, 100, 200, 500],
        "temp": [30.2, 30.0, 29.5, 28.0, 25.5, 21.0, 16.0],
        "salt": [37.2, 37.0, 36.5, 36.0, 35.2, 34.5, 34.0]
    }
}

def compare_model_argo(float_id: str, variable: str, time: str):
    if float_id == "ARGO-3":
        raise ConnectionError("Comparison failed—check API connection.")
    
    argo_data = ARGO_DB.get(float_id)
    if not argo_data:
        raise ValueError("Float not found")
    
    obs_depths = np.array(argo_data["depths"])
    obs_vals = np.array(argo_data["salt" if variable == "salinity" else "temp"])
    
    # Simulate Model interpolation (add slight bias/error)
    model_vals = obs_vals + np.random.normal(0, 0.3, size=len(obs_vals))
    model_vals = np.clip(model_vals, obs_vals - 1.5, obs_vals + 1.5)
    
    # Calculate metrics
    mask = ~np.isnan(obs_vals) & ~np.isnan(model_vals)
    if np.sum(mask) < 2:
        return None, None, None
    
    rmse = np.sqrt(np.mean((model_vals[mask] - obs_vals[mask]) ** 2))
    bias = np.mean(model_vals[mask] - obs_vals[mask])
    
    # Murphy Skill Score
    climatology_rmse = np.std(obs_vals[mask]) if np.std(obs_vals[mask]) > 0 else 0.5
    skill_score = 1 - (rmse / climatology_rmse)
    skill_score = max(-1, min(1, skill_score))
    
    return float(rmse), float(bias), float(skill_score)
