from fastapi import APIRouter, Query, HTTPException
from app.adapters.data_adapter import OceanDataAdapter
from app.services.comparison_service import compare_model_argo
from app.services.thermocline_service import find_thermocline

router = APIRouter()
adapter = OceanDataAdapter()

@router.get("/timesteps")
async def get_timesteps():
    return adapter.get_timesteps()

@router.get("/slice")
async def get_slice(
    variable: str = "salinity",
    depth: float = 100,
    time: str = "2026-08-29",
    bbox: str = Query("50,-10,100,30")
):
    bbox_list = list(map(float, bbox.split(',')))
    return adapter.get_slice(variable, depth, time, bbox_list)

@router.get("/profile")
async def get_profile(lat: float, lon: float, time: str):
    return adapter.get_profile(lat, lon, time)

@router.post("/compare")
async def compare(float_id: str, variable: str = "salinity", time: str = "2026-08-29"):
    try:
        rmse, bias, skill = compare_model_argo(float_id, variable, time)
        if rmse is None:
            raise HTTPException(status_code=404, detail="No overlapping data")
        return {"rmse": rmse, "bias": bias, "skillScore": skill}
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/thermocline")
async def thermocline(lat: float = 10, lon: float = 85, time: str = "2026-08-29"):
    profile = adapter.get_profile(lat, lon, time)
    depth, grad = find_thermocline(profile["depths"], profile["values"])
    return {"depth": depth, "gradient": grad}
