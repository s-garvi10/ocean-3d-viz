import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
os.makedirs(DATA_DIR, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "OCEAN-X API"
    DATA_PATH: Path = DATA_DIR
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000", "*"]

settings = Settings()
