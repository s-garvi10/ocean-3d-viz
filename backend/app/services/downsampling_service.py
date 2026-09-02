import numpy as np
import xarray as xr
import logging

logger = logging.getLogger(__name__)


def downsample_to_target(
    da: xr.DataArray,
    target_lat: int = 100,
    target_lon: int = 100,
) -> xr.DataArray:
    """
    Coarsen a DataArray to at most target_lat × target_lon points.

    This is the correct order of operations:
        time → depth → bbox → downsample → .load()

    We downsample AFTER spatial selection, not before.
    This preserves local detail while bounding GPU memory.
    """
    if "lat" not in da.dims or "lon" not in da.dims:
        return da

    nlat = da.sizes.get("lat", 1)
    nlon = da.sizes.get("lon", 1)

    if nlat <= target_lat and nlon <= target_lon:
        return da  # Already small enough

    coarsen_kwargs = {}
    if nlat > target_lat:
        factor = max(2, nlat // target_lat)
        coarsen_kwargs["lat"] = factor
    if nlon > target_lon:
        factor = max(2, nlon // target_lon)
        coarsen_kwargs["lon"] = factor

    logger.info(f"Coarsening {nlat}×{nlon} → {coarsen_kwargs}")
    return da.coarsen(**coarsen_kwargs, boundary="trim").mean()


def coarsen_for_api(
    data: np.ndarray,
    lats: np.ndarray,
    lons: np.ndarray,
    max_points: int = 10000,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Downsample a numpy grid for API response.
    Keeps total grid points ≤ max_points to cap JSON payload size.
    """
    nlat, nlon = data.shape
    total = nlat * nlon

    if total <= max_points:
        return data, lats, lons

    scale = (max_points / total) ** 0.5
    new_nlat = max(2, int(nlat * scale))
    new_nlon = max(2, int(nlon * scale))

    lat_idx = np.linspace(0, nlat - 1, new_nlat, dtype=int)
    lon_idx = np.linspace(0, nlon - 1, new_nlon, dtype=int)

    downsampled = data[np.ix_(lat_idx, lon_idx)]
    return downsampled, lats[lat_idx], lons[lon_idx]
