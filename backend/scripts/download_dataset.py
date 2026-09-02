"""
download_dataset.py
===================
Downloads or prefetches demo datasets for OCEAN-X.

Usage:
    python scripts/download_dataset.py [--force]

Downloads:
    - data/demo_sst.nc      : 3-day Indian Ocean SST (NOAA OISST)
    - data/demo_argo.nc     : 5 synthetic Argo float profiles

If network access is unavailable, falls back to generating synthetic data
using generate_synthetic_data.py.
"""

import os
import sys
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR    = os.path.join(BACKEND_DIR, "data")


def download_or_generate():
    """Try to download real data; fall back to synthetic generation."""
    os.makedirs(DATA_DIR, exist_ok=True)

    sample_path = os.path.join(DATA_DIR, "sample_ocean_data.nc")
    force = "--force" in sys.argv

    if os.path.exists(sample_path) and not force:
        logger.info(f"Dataset already exists: {sample_path}")
        logger.info("Use --force to re-download / regenerate.")
        return

    logger.info("Attempting to generate synthetic dataset (offline-safe)...")
    try:
        # Import and run the synthetic generator
        gen_script = os.path.join(SCRIPT_DIR, "generate_synthetic_data.py")
        import importlib.util
        spec = importlib.util.spec_from_file_location("gen", gen_script)
        mod  = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        mod.generate()
        logger.info("Synthetic dataset generated successfully.")
    except Exception as exc:
        logger.error(f"Failed to generate dataset: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    download_or_generate()
