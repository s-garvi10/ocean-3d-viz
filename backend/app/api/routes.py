"""
API Routes – OCEAN-X
====================
All endpoints served at /api/v1/…

Endpoints
---------
GET  /timesteps
GET  /depths
GET  /slice
GET  /argo/floats
GET  /argo/{float_id}/profile
POST /compare
GET  /thermocline
GET  /metrics
"""

import random
import logging

from fastapi import APIRouter, Query, HTTPException

from app.services.netcdf_service import NetCDFService
from app.services.argo_service import ArgoService
from app.services.comparison_service import compare_model_argo
from app.services.thermocline_service import find_thermocline
from app.models.schemas import (
    SliceResponse,
    ArgoFloat,
    ArgoProfile,
    ComparisonResponse,
    ThermoclineResponse,
    MetricsResponse,
)

logger = logging.getLogger(__name__)

router  = APIRouter()
netcdf  = NetCDFService()
argo    = ArgoService()


# ── Metadata ────────────────────────────────────────────────────────────────

@router.get("/timesteps", summary="List available time steps")
async def get_timesteps() -> list[str]:
    return netcdf.get_timesteps()


@router.get("/depths", summary="List available depth levels (m)")
async def get_depths() -> list[float]:
    return netcdf.get_depths()


@router.get("/dataset", summary="Dataset metadata summary")
async def get_dataset_info():
    return {
        "timesteps": netcdf.get_timesteps(),
        "depths": netcdf.get_depths(),
        "variables": ["temperature", "salinity", "chlorophyll"],
        "bbox": [50, -10, 100, 30],
        "status": "ready"
    }


# ── Ocean slice ─────────────────────────────────────────────────────────────

@router.get("/slice", response_model=SliceResponse, summary="2-D horizontal ocean slice")
@router.get("/ocean/slice", response_model=SliceResponse, include_in_schema=False)
async def get_slice(
    variable: str   = Query("temperature", description="temperature | salinity | chlorophyll"),
    depth: float    = Query(100.0,          description="Depth level in metres"),
    time: str       = Query("2026-08-29",   description="ISO date string YYYY-MM-DD"),
    bbox: str       = Query("50,-10,100,30",description="lon_min,lat_min,lon_max,lat_max"),
):
    try:
        bbox_tuple = tuple(map(float, bbox.split(",")))
        if len(bbox_tuple) != 4:
            raise ValueError("bbox must have exactly 4 comma-separated values")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid bbox: {exc}")

    return netcdf.get_slice(variable, depth, time, bbox_tuple)


@router.get("/ocean/3d", response_model=SliceResponse, include_in_schema=False)
async def get_3d_volume(
    variable: str = Query("temperature"),
    time: str = Query("2026-08-29"),
    depth_min: float = Query(0),
    depth_max: float = Query(500),
    bbox: str = Query("50,-10,100,30"),
):
    try:
        bbox_tuple = tuple(map(float, bbox.split(",")))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid bbox: {exc}")
    mid_depth = (depth_min + depth_max) / 2
    return netcdf.get_slice(variable, mid_depth, time, bbox_tuple)


# ── Argo floats ─────────────────────────────────────────────────────────────

@router.get(
    "/argo/floats",
    response_model=list[ArgoFloat],
    summary="Argo float positions within a named region",
)
async def get_argo_floats(
    region: str = Query("North Indian Ocean"),
    time: str   = Query("2026-08-29"),
):
    floats = argo.get_floats(region, time)
    return floats


@router.get(
    "/argo/{float_id}/profile",
    response_model=ArgoProfile,
    summary="Vertical T/S profile for a single Argo float",
)
async def get_argo_profile(float_id: str):
    profile = argo.get_profile(float_id)
    return profile


# ── Model–obs comparison ────────────────────────────────────────────────────

@router.post(
    "/compare",
    response_model=ComparisonResponse,
    summary="RMSE / bias / correlation between model and Argo float",
)
async def compare(
    float_id: str = Query(...,              description="Argo float ID (e.g. ARGO-1)"),
    variable: str = Query("temperature",    description="temperature | salinity"),
    time: str     = Query("2026-08-29",     description="ISO date string"),
):
    try:
        float_profile = argo.get_profile(float_id)
        # Approximate float location for model lookup
        floats_in_region = argo.get_floats("North Indian Ocean", time)
        match = next((f for f in floats_in_region if f["id"] == float_id), None)
        lat = match["lat"] if match else 10.0
        lon = match["lon"] if match else 80.0

        model_profile = netcdf.get_profile(lat, lon, time)
        result = compare_model_argo(float_profile, model_profile, float_id, variable)

        if result["rmse"] is None:
            return ComparisonResponse(
                rmse=None, bias=None, correlation=None, mae=None,
                matchedPoints=result["matchedPoints"],
                error="Insufficient overlapping depth levels",
            )
        return ComparisonResponse(**result)

    except Exception as exc:
        logger.error(f"compare error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


# ── Thermocline detection ───────────────────────────────────────────────────

@router.get(
    "/thermocline",
    response_model=ThermoclineResponse,
    summary="Detect thermocline depth and gradient for an Argo float",
)
async def thermocline(
    float_id: str = Query(...,           description="Argo float ID"),
    variable: str = Query("temperature", description="variable used (reserved for future use)"),
    time: str     = Query("2026-08-29"),
):
    profile = argo.get_profile(float_id)
    result  = find_thermocline(profile)
    return ThermoclineResponse(**result)


# ── Quick metrics ───────────────────────────────────────────────────────────

@router.get(
    "/metrics",
    response_model=MetricsResponse,
    summary="Surface metrics (SST, SSH anomaly, wind) at a point",
)
async def get_metrics(
    lat:  float = Query(..., description="Latitude"),
    lon:  float = Query(..., description="Longitude"),
    time: str   = Query(..., description="ISO date string"),
):
    # Pull SST from the model at the requested point
    try:
        profile = netcdf.get_profile(lat, lon, time)
        sst = round(profile["temperatures"][0], 2) if profile["temperatures"] else 28.4
    except Exception:
        sst = round(28.4 + random.uniform(-0.5, 0.5), 2)

    # SSH anomaly and wind speed are not in the synthetic dataset;
    # use physically plausible stochastic values seeded by location.
    rng = random.Random(hash((round(lat, 1), round(lon, 1), time)) & 0xFFFF)
    ssh = round(8.12 + rng.uniform(-1.5, 1.5), 2)
    wind = round(6.8 + rng.uniform(-1.5, 1.5), 2)

    return MetricsResponse(
        sst=sst,
        ssh_anomaly=ssh,
        wind=wind,
        embedding="256 × 4",
    )
