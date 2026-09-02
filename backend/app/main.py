import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="OCEAN-X: 3-D Indian Ocean Visualization Backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes under /api/v1, /api, and root for seamless compatibility
app.include_router(router, prefix=settings.API_V1_STR)
app.include_router(router, prefix="/api")
app.include_router(router, prefix="")


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "🌊 OCEAN-X Backend is live",
        "status": "online",
        "docs": "/docs",
        "api": settings.API_V1_STR,
    }
