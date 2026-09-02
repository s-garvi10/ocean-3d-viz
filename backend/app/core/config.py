import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
os.makedirs(DATA_DIR, exist_ok=True)


class Settings:
    PROJECT_NAME: str = "OCEAN-X Backend"
    API_V1_STR: str = "/api/v1"
    DATA_PATH: Path = DATA_DIR
    DEFAULT_DATASET: str = "sample_ocean_data.nc"
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*",
    ]
    # Cache TTLs (seconds)
    ARGO_CACHE_TTL: int = 3600
    MODEL_CACHE_TTL: int = 300

    # Legacy path helpers (kept for any existing references)
    @property
    def demo_sst_path(self) -> str:
        return str(DATA_DIR / "demo_sst.nc")

    @property
    def demo_argo_path(self) -> str:
        return str(DATA_DIR / "demo_argo.nc")

    @property
    def database_url(self) -> str:
        return os.getenv("DATABASE_URL", "sqlite:///./ocean.db")


settings = Settings()


def get_settings() -> Settings:
    """Backward-compatible factory used by legacy db.py / data_service.py."""
    return settings
