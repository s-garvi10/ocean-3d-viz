import numpy as np
from scipy.interpolate import interp1d, RegularGridInterpolator
import logging

logger = logging.getLogger(__name__)


def interpolate_profile_to_depths(
    source_depths: np.ndarray,
    source_vals: np.ndarray,
    target_depths: np.ndarray,
    method: str = "linear",
) -> np.ndarray:
    """
    Interpolate a vertical profile onto a new set of depth levels.

    Uses fill_value=np.nan — values outside the source depth range
    are returned as NaN (not extrapolated). This is the scientifically
    correct approach for profile comparison.

    Args:
        source_depths: Depths of source profile
        source_vals:   Values at source depths
        target_depths: Depths to interpolate onto
        method:        'linear' or 'cubic'

    Returns:
        Array of interpolated values at target_depths (NaN where out-of-range)
    """
    source_depths = np.array(source_depths, dtype=float)
    source_vals   = np.array(source_vals,   dtype=float)
    target_depths = np.array(target_depths, dtype=float)

    # Remove NaNs from source
    valid = ~(np.isnan(source_depths) | np.isnan(source_vals))
    source_depths = source_depths[valid]
    source_vals   = source_vals[valid]

    if len(source_depths) < 2:
        logger.warning("Too few source points for interpolation")
        return np.full(len(target_depths), np.nan)

    # Sort ascending
    idx = np.argsort(source_depths)
    source_depths = source_depths[idx]
    source_vals   = source_vals[idx]

    f = interp1d(
        source_depths,
        source_vals,
        kind=method,
        bounds_error=False,
        fill_value=np.nan,  # ← no extrapolation
    )
    return f(target_depths)


def interpolate_2d_to_point(
    lats: np.ndarray,
    lons: np.ndarray,
    values: np.ndarray,
    target_lat: float,
    target_lon: float,
) -> float:
    """
    Bilinear interpolation on a 2D grid to extract a single point.
    Returns NaN if the target point is outside the grid.
    """
    lats   = np.array(lats,   dtype=float)
    lons   = np.array(lons,   dtype=float)
    values = np.array(values, dtype=float)

    # RegularGridInterpolator expects sorted ascending coords
    if lats[0] > lats[-1]:
        lats   = lats[::-1]
        values = values[::-1, :]
    if lons[0] > lons[-1]:
        lons   = lons[:, ::-1]
        values = values[:, ::-1]

    try:
        interp = RegularGridInterpolator(
            (lats, lons),
            values,
            method="linear",
            bounds_error=False,
            fill_value=np.nan,
        )
        result = interp([[target_lat, target_lon]])
        return float(result[0])
    except Exception as e:
        logger.warning(f"2D interpolation failed: {e}")
        return float("nan")
