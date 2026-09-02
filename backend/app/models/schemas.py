from pydantic import BaseModel
from typing import List, Optional


class SliceResponse(BaseModel):
    data: List[List[float]]
    lats: List[float]
    lons: List[float]
    min: float
    max: float
    source: Optional[str] = "netcdf"


class ArgoFloat(BaseModel):
    id: str
    lat: float
    lon: float
    temp: Optional[float] = None
    depth: Optional[float] = None


class ArgoProfile(BaseModel):
    depths: List[float]
    temperatures: List[float]
    salinities: List[float]


class ComparisonResponse(BaseModel):
    rmse: Optional[float]
    bias: Optional[float]
    correlation: Optional[float]
    mae: Optional[float]
    matchedPoints: int
    error: Optional[str] = None


class ThermoclineResponse(BaseModel):
    depth: float
    gradient: float


class MetricsResponse(BaseModel):
    sst: float
    ssh_anomaly: float
    wind: float
    embedding: str
