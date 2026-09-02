# 🌊 OCEAN-X — Ocean Intelligence Platform

**NASA-grade 3D ocean data visualization and analytics platform**  
Built for Smart India Hackathon 2026 | Indian Ocean Focus | INCOIS-ready

---

## 🚀 One-Command Launch

```bash
docker-compose up --build
```

Then open: **http://localhost:5173**

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React 3D UI |
| Backend API | http://localhost:8000 | FastAPI |
| API Docs | http://localhost:8000/docs | Swagger UI |
| PostGIS | localhost:5432 | Spatial DB |

---

## 📦 Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **3D Rendering** | Three.js + WebGL | Vertex-colored ocean slices |
| **2D Map** | MapLibre GL | Dark basemap + Argo markers |
| **State** | Zustand | Single source of truth |
| **Charts** | Plotly.js | Depth profiles |
| **Backend** | FastAPI + uvicorn | Async REST API |
| **Data** | xarray + Dask | Lazy NetCDF loading |
| **Science** | numpy + scipy | Thermocline, RMSE |
| **Database** | PostGIS | Spatial Argo float queries |
| **Deploy** | Docker Compose | One-command startup |

---

## 🧪 Offline Demo (No Internet Required)

Generate synthetic demo data before the hackathon:

```bash
cd backend
python scripts/prefetch_demo.py
```

This creates:
- `backend/data/demo_sst.nc` — Indian Ocean SST (3 days)
- `backend/data/demo_argo.nc` — 5 Argo float profiles

The backend **automatically falls back** to synthetic data if these files don't exist.

---

## 🎯 Key Features

### ✅ Checklist
- [x] Docker Compose: PostGIS + Backend + Frontend in one command
- [x] 3D colored depth slice (vertex-colored Three.js mesh)
- [x] Depth slider (0–2000m)
- [x] Argo float click → Plotly depth profile
- [x] RMSE + Bias displayed prominently
- [x] Thermocline marker (red dashed plane in 3D)
- [x] Offline data fallback (synthetic NetCDF)
- [x] Variable switch (Temperature / Salinity / Chlorophyll)
- [x] Time animation (3 timesteps)
- [x] Dark-mode glassmorphism UI

---

## 🔬 Scientific Algorithms

### Thermocline Detection
Uses `numpy.gradient` for accurate central-difference dT/dz:
```python
grad = np.gradient(temps, depths)
thermocline_idx = np.argmin(grad[depths < 500])
```

### Model vs Observation (RMSE)
Uses `scipy.interpolate.interp1d` to map model grid → Argo depths:
```python
f = interp1d(model_depths, model_vals, kind='linear', fill_value='extrapolate')
model_interp = f(obs_depths)
rmse = np.sqrt(np.mean((model_interp - obs_vals) ** 2))
```

---

## 🏗️ Architecture

```
ocean/
├── backend/
│   ├── app/
│   │   ├── adapters/       # OceanDataAdapter ABC + NetCDF/Argo impls
│   │   ├── services/       # Thermocline, RMSE algorithms
│   │   ├── api/            # FastAPI routes
│   │   └── core/           # Config, PostGIS DB
│   ├── data/               # Pre-downloaded demo NetCDF files
│   └── scripts/            # prefetch_demo.py
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── 3D/         # Three.js OceanScene
│       │   ├── Map/        # MapLibre BaseMap
│       │   └── UI/         # ControlPanel, ArgoProfile, ComparePanel, Learn
│       ├── store/          # Zustand oceanStore
│       ├── api/            # Axios oceanApi
│       └── pages/          # Explorer (main)
└── docker-compose.yml
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/slice` | 2D ocean variable slice |
| GET | `/api/v1/profile` | Vertical profile at lat/lon |
| GET | `/api/v1/thermocline` | Thermocline depth detection |
| GET | `/api/v1/argo/floats` | Argo float positions (bbox) |
| GET | `/api/v1/argo/profile/{wmo}` | Individual float profile |
| POST | `/api/v1/compare` | Model vs Argo RMSE/Bias |
| GET | `/api/v1/metadata` | Dataset metadata |

---

## 🎤 3-Minute Pitch (SIH)

> "India manages a vast EEZ, but oceanographers are drowning in data.  
> OCEAN-X transforms complex arrays into an intuitive 3D workstation.  
> We empower forecasters to make faster decisions and help the public understand our oceans."

---

*Built with ❤️ for INCOIS | Smart India Hackathon 2026*
