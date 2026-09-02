import numpy as np
import xarray as xr
import pandas as pd
from pathlib import Path
from app.core.config import settings

class OceanDataAdapter:
    def __init__(self):
        self.dataset_path = settings.DATA_PATH / "demo_sst.nc"
        self._ds = None

    def _load_dataset(self):
        if self._ds is None:
            if self.dataset_path.exists():
                try:
                    self._ds = xr.open_dataset(self.dataset_path, engine="netcdf4")
                    # If loaded dataset lacks 'depth', generate full 4D dataset or adapt
                    if "depth" not in self._ds.dims and "depth" not in self._ds.coords:
                        return self._create_synthetic_dataset()
                    return self._ds
                except Exception as e:
                    print(f"Failed to open NetCDF: {e}")
            return self._create_synthetic_dataset()
        return self._ds

    def _create_synthetic_dataset(self):
        # --- SYNTHETIC FALLBACK (Works 100% offline) ---
        print("⚠️ Generating synthetic dataset (NetCDF not found or fallback)")
        lon = np.linspace(50, 100, 60)
        lat = np.linspace(-10, 30, 50)
        time = pd.date_range('2026-08-28', periods=3)
        depth = np.array([0, 10, 25, 50, 100, 200, 500, 1000])
        
        data = np.random.rand(len(time), len(depth), len(lat), len(lon)) * 10 + 25
        # Add a warm eddy structure
        for t in range(len(time)):
            for d in range(len(depth)):
                data[t, d, :, :] += 5 * np.exp(-((lat[:, None] - 10)**2 + (lon[None, :] - 80)**2) / 200)
        
        self._ds = xr.Dataset({
            'temperature': (['time', 'depth', 'lat', 'lon'], data + 5),
            'salinity': (['time', 'depth', 'lat', 'lon'], data + 30),
            'chlorophyll': (['time', 'depth', 'lat', 'lon'], data * 0.05),
            'sst': (['time', 'depth', 'lat', 'lon'], data + 5),
        }, coords={
            'time': time,
            'depth': depth,
            'lat': lat,
            'lon': lon
        })
        return self._ds

    def get_slice(self, variable: str, depth: float, time: str, bbox: list):
        ds = self._load_dataset()
        min_lon, min_lat, max_lon, max_lat = bbox
        
        try:
            target_var = variable if variable in ds.variables else ('sst' if 'sst' in ds.variables else 'temperature')
            
            # Select nearest depth and time
            sel_kwargs = {"time": time}
            if "depth" in ds[target_var].dims:
                sel_kwargs["depth"] = depth
                
            sliced = ds[target_var].sel(**sel_kwargs, method="nearest").sel(
                lat=slice(min_lat, max_lat),
                lon=slice(min_lon, max_lon)
            )
            # Downsample if too large for GPU
            if sliced.shape[0] > 100 or sliced.shape[1] > 100:
                sliced = sliced.coarsen(lat=2, lon=2, boundary='trim').mean()
            
            data = sliced.values
            # Handle NaN
            nan_mean = float(np.nanmean(data)) if not np.isnan(np.nanmean(data)) else 35.0
            data = np.nan_to_num(data, nan=nan_mean)
            
            return {
                "data": data.tolist(),
                "lats": sliced.lat.values.tolist(),
                "lons": sliced.lon.values.tolist(),
                "min": float(np.nanmin(data)),
                "max": float(np.nanmax(data))
            }
        except Exception as e:
            print(f"Slice error: {e}, returning synthetic fallback")
            # 2D Gaussian fallback
            x = np.linspace(min_lon, max_lon, 40)
            y = np.linspace(min_lat, max_lat, 30)
            X, Y = np.meshgrid(x, y)
            center_x, center_y = 80, 10
            synth = 35 + 5 * np.exp(-((X - center_x)**2 + (Y - center_y)**2) / 150) - (depth / 200)
            return {
                "data": synth.tolist(),
                "lats": y.tolist(),
                "lons": x.tolist(),
                "min": float(np.min(synth)),
                "max": float(np.max(synth))
            }

    def get_timesteps(self):
        ds = self._load_dataset()
        return [str(t)[:10] for t in ds.time.values]

    def get_profile(self, lat, lon, time):
        ds = self._load_dataset()
        try:
            target_var = 'temperature' if 'temperature' in ds.variables else 'sst'
            profile = ds[target_var].sel(lat=lat, lon=lon, time=time, method="nearest")
            depths = profile.depth.values.tolist() if "depth" in profile.coords else [0, 50, 100, 200]
            vals = profile.values.tolist()
            if isinstance(vals, (int, float)):
                vals = [vals, vals - 2, vals - 6, vals - 12]
            return {
                "depths": depths,
                "values": vals
            }
        except:
            return {"depths": [0, 50, 100, 200], "values": [28, 24, 18, 12]}
