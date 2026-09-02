import os
import logging
import numpy as np
import pandas as pd
from app.adapters.netcdf_adapter import NetCDFAdapter
from app.adapters.argo_adapter import ArgoAdapter
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class DataService:
    """
    Orchestrates multiple adapters.

    Priority:
        1. NetCDF file (real data, pre-downloaded)
        2. OPeNDAP/live source (if online)
        3. Synthetic fallback (clearly logged — for UI demo only)
    """

    def __init__(self):
        self.sst_adapter: NetCDFAdapter | None = None
        self.argo_adapter = ArgoAdapter(
            cache_path=settings.demo_argo_path
            if os.path.exists(settings.demo_argo_path) else None
        )
        self._init_sst()

    def _init_sst(self):
        path = settings.demo_sst_path
        if os.path.exists(path):
            logger.info(f"Loading SST adapter from: {path}")
            self.sst_adapter = NetCDFAdapter(path)
        else:
            logger.warning(
                f"No SST file at {path}. "
                "Will use synthetic data. Run scripts/prefetch_demo.py."
            )

    # ── Slice ──────────────────────────────────────────────────────────────

    def get_slice_data(
        self, variable: str, depth: float, time: str, bbox: list[float]
    ) -> dict:
        if self.sst_adapter:
            try:
                da   = self.sst_adapter.get_slice(variable, depth, time, bbox)
                lats = da.lat.values.tolist() if "lat" in da.coords else []
                lons = da.lon.values.tolist() if "lon" in da.coords else []
                arr  = da.values
                return {
                    "data":   arr.tolist(),
                    "lats":   lats,
                    "lons":   lons,
                    "min":    float(np.nanmin(arr)),
                    "max":    float(np.nanmax(arr)),
                    "source": "netcdf",
                }
            except Exception as e:
                logger.error(f"Slice error: {e}. Falling back to synthetic.")

        return self._synthetic_slice(variable, bbox)

    # ── Profile ────────────────────────────────────────────────────────────

    def get_profile_data(self, lat: float, lon: float, time: str) -> dict:
        if self.sst_adapter:
            try:
                df = self.sst_adapter.get_profile(lat, lon, time)
                return df.to_dict(orient="list")
            except Exception:
                pass
        # Argo climatological representative profile
        try:
            df = self.argo_adapter._representative_profile(lat, lon)
            return df.to_dict(orient="list")
        except Exception:
            pass
        return self._fallback_profile()

    # ── Argo ───────────────────────────────────────────────────────────────

    def get_argo_floats(self, bbox: list[float]) -> list[dict]:
        return self.argo_adapter.get_float_list(bbox)

    def get_argo_profile(self, wmo_id: str) -> dict:
        df = self.argo_adapter.get_float_profile(wmo_id)
        return df.to_dict(orient="list")

    # ── Synthetic fallback (clearly labelled) ──────────────────────────────

    def _synthetic_slice(self, variable: str, bbox: list[float]) -> dict:
        """
        Physically-based synthetic 2D field.
        Used ONLY when no real NetCDF data is available.
        Clearly marked source='synthetic' in response.
        """
        logger.info(f"Generating synthetic {variable} slice (no real data available)")
        min_lon, min_lat, max_lon, max_lat = bbox
        lats = np.linspace(min_lat, max_lat, 50)
        lons = np.linspace(min_lon, max_lon, 50)
        lon_g, lat_g = np.meshgrid(lons, lats)

        if variable == "salinity":
            data = (34.5 + 0.5 * np.sin(np.radians(lat_g))
                    + 0.3 * np.cos(np.radians(lon_g))
                    + np.random.default_rng(42).normal(0, 0.1, lat_g.shape))
            vmin, vmax = 33.0, 36.5

        elif variable == "chlorophyll":
            data = (0.3 + 0.5 * np.exp(-((lon_g - 72) ** 2 + (lat_g - 10) ** 2) / 50)
                    + np.random.default_rng(42).normal(0, 0.02, lat_g.shape))
            data = np.clip(data, 0.01, None)
            vmin, vmax = 0.01, 3.0

        else:  # temperature (SST)
            data = (28.0 - 0.1 * lat_g
                    + 0.05 * np.sin(np.radians(lon_g * 3))
                    + np.random.default_rng(42).normal(0, 0.3, lat_g.shape))
            vmin, vmax = 20.0, 32.0

        return {
            "data":   data.tolist(),
            "lats":   lats.tolist(),
            "lons":   lons.tolist(),
            "min":    vmin,
            "max":    vmax,
            "source": "synthetic",
        }

    def _fallback_profile(self) -> dict:
        depths = [0, 10, 30, 50, 100, 200, 500, 1000, 2000]
        temps  = [29.0, 28.5, 27.0, 24.0, 18.0, 12.0, 7.0, 4.5, 3.0]
        sals   = [34.2, 34.3, 34.5, 34.8, 35.0, 34.9, 34.7, 34.6, 34.5]
        return {"depth": depths, "temperature": temps, "salinity": sals}


_data_service: DataService | None = None


def get_data_service() -> DataService:
    global _data_service
    if _data_service is None:
        _data_service = DataService()
    return _data_service
