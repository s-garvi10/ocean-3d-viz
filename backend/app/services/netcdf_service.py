"""
NetCDF Service
==============
Loads a 4-D ocean dataset (time × depth × lat × lon) from disk.
If no file is present it auto-generates a physics-inspired synthetic dataset
so the API never returns empty data, even in a fully offline environment.

Data priority
-------------
1. data/sample_ocean_data.nc   (pre-generated or user-supplied)
2. Synthetic in-memory fallback (generated on first import)
"""

import numpy as np
import xarray as xr
import pandas as pd
from pathlib import Path
from cachetools import cached, TTLCache
from app.core.config import settings

# TTL cache: keep up to 10 distinct slices for 5 minutes each
_slice_cache: TTLCache = TTLCache(maxsize=10, ttl=settings.MODEL_CACHE_TTL)


class NetCDFService:
    """Singleton-friendly service wrapping the NetCDF dataset."""

    def __init__(self):
        self.dataset_path: Path = settings.DATA_PATH / settings.DEFAULT_DATASET
        self._ds: xr.Dataset | None = None

    # ── Internal helpers ───────────────────────────────────────────────────

    def _load_dataset(self) -> xr.Dataset:
        if self._ds is not None:
            return self._ds

        if self.dataset_path.exists():
            try:
                ds = xr.open_dataset(self.dataset_path, engine="netcdf4")
                ds = self._normalize_dims(ds)
                self._ds = ds
                print(f"[OK] Loaded NetCDF from {self.dataset_path}")
                return self._ds
            except Exception as exc:
                print(f"[WARN]  Failed to open NetCDF ({exc}). Generating synthetic data.")

        print("[INFO]  Generating synthetic 4-D ocean dataset (offline mode).")
        self._ds = self._generate_synthetic()
        return self._ds

    @staticmethod
    def _normalize_dims(ds: xr.Dataset) -> xr.Dataset:
        """Rename common dimension aliases to canonical names."""
        rename: dict[str, str] = {}
        for dim in ds.dims:
            if dim in ("latitude",):
                rename[dim] = "lat"
            elif dim in ("longitude",):
                rename[dim] = "lon"
            elif dim in ("lev", "deptht", "z_l", "z_t"):
                rename[dim] = "depth"
            elif dim == "t":
                rename[dim] = "time"
        return ds.rename(rename) if rename else ds

    @staticmethod
    def _generate_synthetic() -> xr.Dataset:
        """
        Build a physics-inspired 4-D Indian Ocean dataset with
        - A warm eddy centred at (10°N, 80°E)
        - Realistic temperature/depth decay
        - Correlated salinity + chlorophyll fields
        """
        lats   = np.linspace(-10, 30, 60)
        lons   = np.linspace(50, 100, 80)
        depths = np.array([0, 10, 25, 50, 100, 200, 500, 1000], dtype=float)
        times  = pd.date_range("2026-08-28", periods=3, freq="D")

        T, D, La, Lo = len(times), len(depths), len(lats), len(lons)

        rng  = np.random.default_rng(42)
        temp = np.zeros((T, D, La, Lo))
        lon_g, lat_g = np.meshgrid(lons, lats)          # (La, Lo)

        for t in range(T):
            for d, dep in enumerate(depths):
                dist  = np.sqrt((lat_g - 10) ** 2 + (lon_g - 80) ** 2)
                base  = 28.5 - (dep / 1000) * 20        # surface → deep gradient
                eddy  = 4.0 * np.exp(-dist ** 2 / 200)  # warm-core eddy
                noise = rng.normal(0, 0.15, (La, Lo))
                temp[t, d] = base + eddy + noise

        # Salinity: inversely correlated with temperature (warm = fresher river outflow)
        salt = 35.5 - 0.05 * temp + rng.normal(0, 0.08, (T, D, La, Lo))
        salt = np.clip(salt, 30, 40)

        # Chlorophyll: surface-trapped, higher in cooler upwelling zones
        chl  = 0.2 + 0.6 * np.exp(-temp / 30) + rng.normal(0, 0.02, (T, D, La, Lo))
        chl  = np.clip(chl, 0.01, 5.0)

        ds = xr.Dataset(
            {
                "temperature":  (["time", "depth", "lat", "lon"], temp),
                "salinity":     (["time", "depth", "lat", "lon"], salt),
                "chlorophyll":  (["time", "depth", "lat", "lon"], chl),
            },
            coords={
                "time":  times,
                "depth": depths,
                "lat":   lats,
                "lon":   lons,
            },
        )
        ds.attrs.update(
            title="OCEAN-X Synthetic Indian Ocean Dataset",
            source="physics-inspired synthetic (offline demo)",
            Conventions="CF-1.8",
        )
        return ds

    # ── Public API ─────────────────────────────────────────────────────────

    def get_timesteps(self) -> list[str]:
        ds = self._load_dataset()
        times = ds.time.values
        # Return ISO date strings (YYYY-MM-DD)
        return [str(np.datetime_as_string(t, unit="D")) for t in times]

    def get_depths(self) -> list[float]:
        ds = self._load_dataset()
        return [float(d) for d in ds.depth.values]

    @cached(cache=_slice_cache)
    def get_slice(
        self,
        variable: str,
        depth: float,
        time: str,
        bbox: tuple,          # (min_lon, min_lat, max_lon, max_lat)
    ) -> dict:
        ds = self._load_dataset()
        min_lon, min_lat, max_lon, max_lat = bbox

        # Fall back to a known variable if the requested one isn't present
        if variable not in ds.data_vars:
            variable = "temperature"

        try:
            sel_kwargs = {"depth": depth, "method": "nearest"}
            if "time" in ds.coords:
                try:
                    sel_kwargs["time"] = pd.to_datetime(time)
                except Exception:
                    pass
            da = ds[variable].sel(**sel_kwargs).sel(
                lat=slice(min_lat, max_lat),
                lon=slice(min_lon, max_lon),
            )

            # Downsample large tiles to keep JSON payload manageable
            nlat, nlon = da.sizes.get("lat", 1), da.sizes.get("lon", 1)
            if nlat > 100 or nlon > 100:
                lat_factor = max(2, nlat // 80)
                lon_factor = max(2, nlon // 80)
                da = da.coarsen(lat=lat_factor, lon=lon_factor, boundary="trim").mean()

            arr = da.values.astype(float)
            arr = np.nan_to_num(arr, nan=float(np.nanmean(arr)) if not np.all(np.isnan(arr)) else 0.0)

            return {
                "data": arr.tolist(),
                "lats": da.lat.values.tolist(),
                "lons": da.lon.values.tolist(),
                "min":  float(np.nanmin(arr)),
                "max":  float(np.nanmax(arr)),
                "source": "netcdf",
            }

        except Exception as exc:
            print(f"[WARN]  Slice error ({exc}). Returning synthetic fallback.")
            return self._synthetic_slice_fallback(variable, depth, min_lon, min_lat, max_lon, max_lat)

    @staticmethod
    def _synthetic_slice_fallback(
        variable: str, depth: float,
        min_lon: float, min_lat: float, max_lon: float, max_lat: float,
    ) -> dict:
        lons = np.linspace(min_lon, max_lon, 50)
        lats = np.linspace(min_lat, max_lat, 40)
        lo_g, la_g = np.meshgrid(lons, lats)
        dist = np.sqrt((la_g - 10) ** 2 + (lo_g - 80) ** 2)

        if variable == "salinity":
            arr = 35.5 - (depth / 500) * 1.5 + 0.5 * np.sin(np.radians(la_g))
        elif variable == "chlorophyll":
            arr = 0.2 + 0.5 * np.exp(-dist ** 2 / 200)
        else:  # temperature
            arr = 28.5 - (depth / 200) * 5 + 4 * np.exp(-dist ** 2 / 200)

        return {
            "data": arr.tolist(),
            "lats": lats.tolist(),
            "lons": lons.tolist(),
            "min":  float(np.min(arr)),
            "max":  float(np.max(arr)),
            "source": "synthetic",
        }

    def get_profile(self, lat: float, lon: float, time: str) -> dict:
        ds = self._load_dataset()
        try:
            sel_kwargs = {"lat": lat, "lon": lon, "method": "nearest"}
            if "time" in ds.coords:
                try:
                    sel_kwargs["time"] = pd.to_datetime(time)
                except Exception:
                    pass
            temp_da = ds["temperature"].sel(**sel_kwargs)
            salt_da = ds["salinity"].sel(**sel_kwargs)
            return {
                "depths":       temp_da.depth.values.tolist(),
                "temperatures": temp_da.values.tolist(),
                "salinities":   salt_da.values.tolist(),
            }
        except Exception:
            depths = [0, 10, 25, 50, 100, 200, 500]
            return {
                "depths":       depths,
                "temperatures": [28.5 - d / 50 for d in depths],
                "salinities":   [35.5 - d / 300 for d in depths],
            }
