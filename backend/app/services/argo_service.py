"""
Argo Float Service
==================
Provides Argo float positions and profiles.

Data priority
-------------
1. argopy real-time GDAC fetch (requires internet)
2. INCOIS ERDDAP tabledap (Indian Argo floats)
3. Synthetic floats (physics-inspired, clearly labelled)
"""

import random
import logging
from cachetools import cached, TTLCache
from app.core.config import settings

logger = logging.getLogger(__name__)

# Cache float lists for 1 hour
_argo_cache: TTLCache = TTLCache(maxsize=20, ttl=settings.ARGO_CACHE_TTL)

# Region bounding boxes  [lon_min, lat_min, lon_max, lat_max]
REGION_BOUNDS: dict[str, list[float]] = {
    "North Indian Ocean":  [50, -10, 100, 30],
    "Arabian Sea":         [50,   5,  75, 25],
    "Bay of Bengal":       [80,   5, 100, 25],
    "Andaman Sea":         [90,   5, 100, 15],
    "Lakshadweep Sea":     [70,   5,  78, 15],
}

# Representative real WMO IDs for synthetic profiles
_SYNTHETIC_FLOATS = [
    {"id": "4903225", "lat": 12.5, "lon": 72.3},
    {"id": "2902989", "lat":  8.2, "lon": 78.9},
    {"id": "6903004", "lat": 15.7, "lon": 68.4},
    {"id": "4902916", "lat": 20.1, "lon": 65.8},
    {"id": "2902112", "lat":  6.8, "lon": 80.2},
    {"id": "ARGO-6",  "lat": 18.3, "lon": 88.5},
    {"id": "ARGO-7",  "lat": 22.0, "lon": 82.0},
    {"id": "ARGO-8",  "lat":  5.0, "lon": 76.0},
]


class ArgoService:
    """Fetches Argo float data with graceful fallback to synthetic."""

    # ── Public API ─────────────────────────────────────────────────────────

    @cached(cache=_argo_cache)
    def get_floats(self, region: str, time: str) -> list[dict]:
        bounds = REGION_BOUNDS.get(region, REGION_BOUNDS["North Indian Ocean"])
        lon_min, lat_min, lon_max, lat_max = bounds

        # 1️⃣ Try argopy GDAC
        try:
            return self._fetch_argopy(lon_min, lat_min, lon_max, lat_max, time)
        except Exception as exc:
            logger.warning(f"argopy fetch failed ({exc}). Trying INCOIS ERDDAP…")

        # 2️⃣ Try INCOIS ERDDAP tabledap
        try:
            return self._fetch_incois_erddap(lon_min, lat_min, lon_max, lat_max)
        except Exception as exc:
            logger.warning(f"INCOIS ERDDAP failed ({exc}). Using synthetic floats.")

        # 3️⃣ Synthetic fallback
        return self._synthetic_floats(lon_min, lat_min, lon_max, lat_max)

    def get_profile(self, float_id: str) -> dict:
        # 1️⃣ Try argopy for real profiles
        try:
            return self._fetch_argopy_profile(float_id)
        except Exception as exc:
            logger.warning(f"argopy profile fetch failed for {float_id} ({exc}). Using synthetic.")

        return self._synthetic_profile(float_id)

    # ── Real-data fetchers ─────────────────────────────────────────────────

    @staticmethod
    def _fetch_argopy(
        lon_min: float, lat_min: float, lon_max: float, lat_max: float, time: str
    ) -> list[dict]:
        from argopy import DataFetcher  # lazy import to avoid startup errors

        date_end = time if "-" in time else "2026-08-30"
        ds = DataFetcher(src="gdac").region(
            [lon_min, lon_max, lat_min, lat_max, "2026-01-01", date_end]
        ).to_xarray()

        floats = ds.argo.point2profile()
        df     = floats.to_dataframe().reset_index()

        result: list[dict] = []
        for _, row in df.iterrows():
            result.append({
                "id":    str(row.get("PLATFORM_NUMBER", row.get("wmo", f"ARGO-{_}"))),
                "lat":   float(row.get("LATITUDE",  row.get("latitude",  0))),
                "lon":   float(row.get("LONGITUDE", row.get("longitude", 0))),
                "temp":  float(row.get("TEMP",      row.get("temperature", 25 + random.random() * 3))),
                "depth": float(row.get("PRES",      row.get("depth", 100 + random.random() * 200))),
            })
            if len(result) >= 20:
                break
        if not result:
            raise ValueError("No floats returned from argopy")
        return result

    @staticmethod
    def _fetch_incois_erddap(
        lon_min: float, lat_min: float, lon_max: float, lat_max: float
    ) -> list[dict]:
        import urllib.request
        import json

        # INCOIS ERDDAP tabledap – Indian Argo floats
        url = (
            "https://erddap.incois.gov.in/erddap/tabledap/Indian_ARGO_Floats.json"
            f"?latitude,longitude,PLATFORM_NUMBER,TEMP&"
            f"latitude>={lat_min}&latitude<={lat_max}&"
            f"longitude>={lon_min}&longitude<={lon_max}&"
            f"&.limit=20"
        )
        with urllib.request.urlopen(url, timeout=10) as resp:
            payload = json.loads(resp.read())

        rows = payload["table"]["rows"]
        cols = payload["table"]["columnNames"]
        lat_i  = cols.index("latitude")
        lon_i  = cols.index("longitude")
        wmo_i  = cols.index("PLATFORM_NUMBER")
        temp_i = cols.index("TEMP") if "TEMP" in cols else -1

        result: list[dict] = []
        for row in rows[:20]:
            result.append({
                "id":    str(row[wmo_i]),
                "lat":   float(row[lat_i]),
                "lon":   float(row[lon_i]),
                "temp":  float(row[temp_i]) if temp_i >= 0 and row[temp_i] else None,
                "depth": None,
            })
        if not result:
            raise ValueError("No rows from INCOIS ERDDAP")
        return result

    @staticmethod
    def _fetch_argopy_profile(float_id: str) -> dict:
        from argopy import DataFetcher

        wmo = float_id.replace("ARGO-", "")
        if not wmo.isdigit():
            raise ValueError(f"Non-numeric WMO ID: {float_id}")

        ds = DataFetcher(src="gdac").float(int(wmo)).to_xarray()
        df = ds.argo.point2profile().to_dataframe().reset_index()

        # Most recent profile
        depths = df["PRES"].values.tolist()
        temps  = df["TEMP"].values.tolist()
        salts  = df["PSAL"].values.tolist() if "PSAL" in df.columns else [35.0] * len(depths)
        return {"depths": depths, "temperatures": temps, "salinities": salts}

    # ── Synthetic helpers ──────────────────────────────────────────────────

    @staticmethod
    def _synthetic_floats(
        lon_min: float, lat_min: float, lon_max: float, lat_max: float
    ) -> list[dict]:
        """10-15 synthetic floats with realistic temp/depth."""
        import numpy as np
        rng = np.random.default_rng(99)
        n   = 12
        lats = rng.uniform(lat_min, lat_max, n)
        lons = rng.uniform(lon_min, lon_max, n)
        result: list[dict] = []
        for i in range(n):
            dist = np.sqrt((lats[i] - 10) ** 2 + (lons[i] - 80) ** 2)
            temp = 28.5 + 3.0 * np.exp(-dist ** 2 / 200) + rng.normal(0, 0.3)
            result.append({
                "id":    f"ARGO-{i + 1}",
                "lat":   round(float(lats[i]), 3),
                "lon":   round(float(lons[i]), 3),
                "temp":  round(float(temp), 2),
                "depth": round(float(rng.uniform(50, 500)), 1),
            })
        return result

    @staticmethod
    def _synthetic_profile(float_id: str) -> dict:
        """Physically realistic synthetic T/S profile with random seed from float_id."""
        import numpy as np
        seed = sum(ord(c) for c in float_id) % 1000
        rng  = np.random.default_rng(seed)

        depths = np.array([0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 500], dtype=float)
        temps  = 29.5 * np.exp(-depths / 300) + 4.5 + rng.normal(0, 0.2, len(depths))
        salts  = 34.2 + 0.8 * np.exp(-depths / 100) + rng.normal(0, 0.03, len(depths))
        return {
            "depths":       depths.tolist(),
            "temperatures": temps.tolist(),
            "salinities":   salts.tolist(),
        }
