"""
OCEAN-X Demo Data Prefetcher
Run this script BEFORE the hackathon to download a small regional subset.
Usage: python backend/scripts/prefetch_demo.py

The script downloads:
1. 3 days of NOAA OISST Sea Surface Temperature for the Indian Ocean
2. Argo float profiles in the same region

If internet is unavailable, the backend automatically falls back to synthetic data.
"""

import os
import sys
import logging

# Add parent to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../"))

import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SST_OUTPUT = os.path.join(OUTPUT_DIR, "demo_sst.nc")
ARGO_OUTPUT = os.path.join(OUTPUT_DIR, "demo_argo.nc")

# Indian Ocean region
LAT_MIN, LAT_MAX = -10, 30
LON_MIN, LON_MAX = 50, 100
DATE_START = "2026-08-28"
DATE_END = "2026-08-30"


def create_synthetic_sst():
    """Create a synthetic SST NetCDF for offline demo use."""
    logger.info("Creating synthetic SST demo dataset...")
    try:
        import xarray as xr
        import pandas as pd
        import numpy as np

        lats = np.linspace(LAT_MIN, LAT_MAX, 80)
        lons = np.linspace(LON_MIN, LON_MAX, 100)
        times = pd.date_range(DATE_START, DATE_END, freq="D")

        lon_grid, lat_grid = np.meshgrid(lons, lats)

        sst_data = np.zeros((len(times), len(lats), len(lons)))
        for t in range(len(times)):
            # Realistic SST pattern: warm equatorial, cooler north
            sst_data[t] = (
                28.5
                - 0.08 * lat_grid
                + 0.05 * np.sin(np.radians(lon_grid * 3))
                + 0.3 * np.sin(2 * np.pi * t / 365)
                + np.random.normal(0, 0.2, lat_grid.shape)
            )

        ds = xr.Dataset(
            {"sst": (["time", "lat", "lon"], sst_data)},
            coords={
                "time": times,
                "lat": lats,
                "lon": lons,
            },
        )
        ds["sst"].attrs = {
            "units": "°C",
            "long_name": "Sea Surface Temperature",
            "standard_name": "sea_surface_temperature",
        }
        ds.attrs = {
            "title": "OCEAN-X Demo SST — Indian Ocean",
            "source": "Synthetic data for offline demo",
            "institution": "OCEAN-X",
            "Conventions": "CF-1.8",
        }
        ds.to_netcdf(SST_OUTPUT)
        logger.info(f"✅ Synthetic SST saved to: {SST_OUTPUT}")
        return True
    except Exception as e:
        logger.error(f"Failed to create synthetic SST: {e}")
        return False


def download_real_sst():
    """Attempt to download real NOAA OISST data."""
    logger.info("Attempting to download NOAA OISST data...")
    try:
        import xarray as xr

        url = "https://www.ncei.noaa.gov/thredds/dodsC/OisstBase/NetCDF/V2.1/AVHRR/202608/oisst-avhrr-v02r01.20260829.nc"
        logger.info(f"Connecting to: {url}")

        ds = xr.open_dataset(url, engine="netcdf4")
        subset = ds.sel(
            lat=slice(LAT_MIN, LAT_MAX),
            lon=slice(LON_MIN, LON_MAX),
        )
        subset.to_netcdf(SST_OUTPUT)
        logger.info(f"✅ Real SST data saved to: {SST_OUTPUT}")
        return True
    except Exception as e:
        logger.warning(f"Real SST download failed: {e}")
        return False


def create_synthetic_argo():
    """Create a synthetic Argo profiles NetCDF for offline demo use."""
    logger.info("Creating synthetic Argo demo dataset...")
    try:
        import xarray as xr
        import numpy as np

        floats = [
            {"wmo": "4903225", "lat": 12.5, "lon": 72.3},
            {"wmo": "2902989", "lat": 8.2, "lon": 78.9},
            {"wmo": "6903004", "lat": 15.7, "lon": 68.4},
            {"wmo": "4902916", "lat": 20.1, "lon": 65.8},
            {"wmo": "2902112", "lat": 6.8, "lon": 80.2},
        ]
        depths = np.array([0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 500])
        n_floats = len(floats)
        n_depths = len(depths)

        temps = np.zeros((n_floats, n_depths))
        sals = np.zeros((n_floats, n_depths))
        lats = np.array([f["lat"] for f in floats])
        lons = np.array([f["lon"] for f in floats])

        for i in range(n_floats):
            temps[i] = 29.5 * np.exp(-depths / 300) + 4.5 + np.random.normal(0, 0.2, n_depths)
            sals[i] = 34.2 + 0.8 * np.exp(-depths / 100) + np.random.normal(0, 0.03, n_depths)

        ds = xr.Dataset(
            {
                "temperature": (["float_id", "depth"], temps),
                "salinity": (["float_id", "depth"], sals),
                "latitude": (["float_id"], lats),
                "longitude": (["float_id"], lons),
            },
            coords={
                "depth": depths,
                "float_id": [f["wmo"] for f in floats],
            },
        )
        ds.to_netcdf(ARGO_OUTPUT)
        logger.info(f"✅ Synthetic Argo data saved to: {ARGO_OUTPUT}")
        return True
    except Exception as e:
        logger.error(f"Failed to create synthetic Argo data: {e}")
        return False


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("🌊 OCEAN-X Demo Data Prefetcher")
    logger.info("=" * 60)

    # Try real data first, fall back to synthetic
    if not os.path.exists(SST_OUTPUT):
        if not download_real_sst():
            logger.info("Falling back to synthetic SST data...")
            create_synthetic_sst()
    else:
        logger.info(f"SST file already exists: {SST_OUTPUT}")

    if not os.path.exists(ARGO_OUTPUT):
        create_synthetic_argo()
    else:
        logger.info(f"Argo file already exists: {ARGO_OUTPUT}")

    logger.info("=" * 60)
    logger.info("✅ Demo data ready. Start the backend with docker-compose up.")
    logger.info("=" * 60)
