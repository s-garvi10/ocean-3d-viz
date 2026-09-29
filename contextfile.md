# OCEAN-X Project Context

## 1. Project Identity

OCEAN-X is an ocean intelligence and subsurface visualization prototype for exploring modeled ocean data and comparing it with ARGO float observations. The product is presented as a dark, technical, full-screen scientific dashboard focused on the North Indian Ocean and nearby regional seas.

The primary experience combines:

- A Three.js globe rendered with React Three Fiber.
- A colorized ocean data surface/depth curtain generated from a gridded model slice.
- ARGO float markers that can be hovered and selected.
- A validation drawer containing vertical profiles, model-versus-observation metrics, and thermocline information.
- A MapLibre mini-map for geographic context.
- Time, depth, variable, and region controls in a fixed bottom toolbar.
- A left navigation rail for visualization modes and product areas.
- Offline/demo fallbacks so the frontend can still render when the API is unavailable.

The repository is located in the `ocean-3d-viz` directory.

## 2. Repository Layout

```text
ocean-3d-viz/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── run.sh
│   ├── app/
│   │   ├── main.py                 # FastAPI application and route registration
│   │   ├── api/routes.py           # API endpoints
│   │   ├── core/config.py          # Settings, paths, CORS, cache TTLs
│   │   ├── core/db.py              # Database compatibility layer
│   │   ├── adapters/               # Data adapter interfaces/implementations
│   │   ├── models/schemas.py       # Pydantic response schemas
│   │   ├── services/               # NetCDF, ARGO, comparison, interpolation, etc.
│   │   └── utils/cache.py          # Cache helpers
│   ├── data/
│   │   ├── sample_ocean_data.nc
│   │   ├── demo_argo.nc
│   │   └── demo_sst.nc
│   └── scripts/                    # Synthetic data and demo preparation scripts
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── App.tsx                 # Main composition and data-loading effects
        ├── index.css               # Global reset and base visual styles
        ├── main.tsx                # React entry point
        ├── api/oceanApi.ts         # Axios API client and fallbacks
        ├── store/oceanStore.ts     # Zustand application state
        ├── utils/colorUtils.ts     # Scientific palette mapping
        └── components/
            ├── 3D/EarthScene.tsx
            ├── Layout/Sidebar.tsx
            ├── Layout/BottomBar.tsx
            ├── Map/MiniMap.tsx
            └── UI/
                ├── LearnModal.tsx
                ├── MetricsCards.tsx
                ├── ProfileChart.tsx
                └── ValidationPanel.tsx
```

## 3. Technology Stack

### Frontend

- React 18 with TypeScript.
- Vite 5 for development and production builds.
- React Three Fiber and Three.js for the 3D scene.
- `@react-three/drei` for orbit controls, spheres, and HTML labels.
- Zustand for global state.
- Axios for API requests.
- MapLibre GL for the non-interactive geographic mini-map.
- Plotly via `react-plotly.js` for ARGO depth profiles.
- Chroma.js for continuous scientific color scales.

### Backend

- FastAPI with Uvicorn.
- xarray and NetCDF4 for model data.
- NumPy and SciPy for scientific calculations and interpolation.
- Pydantic 2 for response models.
- Dask and cachetools are included for data handling/caching.
- The default settings point at local NetCDF files in `backend/data`.

### Deployment

- Docker Compose defines backend, frontend, and a PostGIS service reference in the compose file.
- The current compose file contains backend and frontend service definitions; verify database usage before assuming PostGIS is required at runtime.
- Backend container base image: Python 3.11 slim.
- Frontend container base image: Node 20 Alpine.

## 4. Runtime Commands

From the `ocean-3d-viz` directory:

```bash
# Recommended container launch
sudo docker-compose up --build
```

The user running Docker must have access to `/var/run/docker.sock`. On systems where the Docker Compose plugin is unavailable, use the standalone `docker-compose` command. The repository's README uses `docker-compose up --build`; `docker compose up --build` may not be available on every machine.

Expected URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

Local development without Docker:

```bash
# Backend, after dependencies are installed
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend
npm install
npm run dev -- --host
```

The checked-in `backend/test_venv` is not guaranteed to contain all required packages. In particular, it may lack Uvicorn even though Uvicorn is listed in `backend/requirements.txt`.

Frontend validation/build:

```bash
cd frontend
npm run build
```

This runs TypeScript compilation followed by the Vite production build. The current build succeeds but emits a large-chunk warning because Plotly and the visualization dependencies are bundled into a very large JavaScript asset.

Offline/demo data preparation:

```bash
cd backend
python scripts/prefetch_demo.py
```

The backend also uses the included synthetic NetCDF data and the frontend has mock fallbacks for most API calls.

## 5. Application Composition

`frontend/src/App.tsx` owns the main layout and global fetch effects. The application is a fixed-height, fixed-width viewport experience:

- `Sidebar` occupies a 260px left column.
- The main visualization occupies the center column.
- `ValidationPanel` occupies a 320px right column only when an ARGO float is active or the pointer is over the panel.
- `BottomBar` occupies an 80px row across the bottom of the main area.
- `EarthScene`, `MetricsCards`, `MiniMap`, loading feedback, error feedback, and the depth color strip are layered in the center.
- `LearnModal` is rendered above the entire application when the guide is open.

The root layout uses CSS grid areas named `sidebar`, `main`, `rightpanel`, and `bottom`. The right panel changes the grid from `260px 1fr 0px` to `260px 1fr 320px` with a 250ms easing transition.

There is no router. Navigation items update Zustand's `displayMode`; the current screen remains the same main composition, except for behavior explicitly implemented for the globe, depth curtain, guide modal, and a few layer toggles.

## 6. Visual/UI Language

The visual direction is a dark mission-control/scientific-instrument interface rather than a conventional website.

### Base appearance

- Body background: `#05080f`.
- Global font: `'Courier New', monospace`.
- Primary text: pale blue-gray, approximately `#c0d0e0`.
- Panels use translucent navy-black surfaces such as `rgba(8, 12, 25, 0.95)`.
- Backdrop blur is used heavily on navigation, bottom controls, metric cards, and the validation panel.
- Borders are thin and low-opacity cyan lines.
- Scrollbars are intentionally narrow: 4px wide with a dark blue thumb.
- Most controls use compact uppercase labels with increased letter spacing.
- The interface favors small monospace labels, bright data values, and restrained spacing around dense scientific information.

### Accent colors

- Cyan/blue: primary interaction and selected state, commonly `#00aaff`, `#00ddff`, `#44ccff`, and `#88ccff`.
- Green: healthy/completed state and temperature/validation success, commonly `#00ff88` and `#00ffaa`.
- Amber/orange: selected ARGO floats, warnings, thermocline, and in-progress work, commonly `#ffaa00`, `#ffaa44`, and `#ff6644`.
- Pink: embedding metric accent, `#ff66aa`.
- Muted text: `#445566` and `#8899bb`.

### Surfaces and shape language

- Primary panels are rectangular or gently rounded, usually with 4px to 12px radii.
- The metrics strip is pill-shaped with a 40px radius.
- The bottom play button and quick-location controls are pill-shaped.
- The validation drawer uses a flat vertical panel with a shadow and a subtle left border.
- Data subsections inside the validation panel use dark translucent blocks with 8px radius.
- The 3D globe is unframed and fills the main visualization area.

### Typography hierarchy

- Product name `OCEAN-X`: bold white, approximately 20px.
- Section labels: 9px to 10px uppercase, letter-spaced, blue-gray.
- Navigation labels: approximately 13px monospace.
- Main metric values: approximately 18px bold with color-coded accents.
- Validation values: 16px to 18px and brighter than supporting labels.
- Long-form guide content: approximately 13px with a 1.6 line height.

## 7. Main UI Areas

### 7.1 Left navigation rail

Implemented in `frontend/src/components/Layout/Sidebar.tsx`.

The sidebar contains:

- OCEAN-X branding.
- Subtitle: `Subsurface Intelligence - Ocean Insight`.
- Navigation items with emoji icons:
  - Outreach & Guide
  - Live Ocean
  - 3D Globe
  - Depth Curtain
  - Temperature Profile
  - Currents
  - ARGO Floats
  - AI Reconstruction
  - Validation
  - Data Sources
  - Analytics
  - Settings
- API pipeline status block.
- Footer branding: `OceanEmbed v1.0` and `INCOIS · SIH 2026`.

Active navigation uses a translucent cyan background, a 3px cyan left border, and white text. Inactive items use muted blue-gray text.

The ARGO and Currents items show a small status dot. ARGO is green when `showArgo` is enabled; Currents is blue when `showCurrents` is enabled.

The API pipeline is currently presentation-oriented status UI:

- Data Ingestion: completed.
- Satellite Processing: completed.
- AI Encoding: completed.
- Embedding: completed.
- Reconstruction: in progress at 76%.
- Validation: pending.

These statuses are hard-coded in the component and are not driven by live pipeline state.

Navigation behavior:

- `Live Ocean` resets display mode, temperature, depth, time, model visibility, and ARGO visibility.
- `3D Globe` sets `displayMode` to `3dglobe` and hides the model layer.
- `Depth Curtain` sets `displayMode` to `depthcurtain` and enables the model layer.
- `Temperature Profile` selects profile mode and temperature.
- `Currents` toggles the currents layer.
- `ARGO Floats` toggles the ARGO layer.
- Outreach opens the guide modal through the `outreach` display mode.
- AI, Validation, Data Sources, Analytics, and Settings update state but do not currently render separate views in `App.tsx`.

Important implementation detail: the 3D scene only renders the model curtain when `displayMode === 'depthcurtain'`. Most other display modes are state labels without dedicated visual content.

### 7.2 Main 3D globe

Implemented in `frontend/src/components/3D/EarthScene.tsx`.

The scene includes:

- A textured Earth sphere using remote Three.js example textures.
- A transparent cloud sphere.
- A custom additive-blended atmosphere shader.
- Approximately 4,000 generated star points surrounding the globe.
- Ambient and directional lights.
- Damped orbit controls.
- Camera distance limits from 2.5 to 12.
- A colorized model surface/depth curtain.
- ARGO float markers and HTML labels.
- Optional thermocline ring.
- Optional grid helper.

The camera starts at `[3, 1.5, 5]` with a 40-degree field of view. Users can drag to rotate the globe and scroll to zoom. Starting a manual orbit cancels the automated fly-to animation.

The Earth textures are loaded from:

- `https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg`
- `https://threejs.org/examples/textures/planets/earth_specular_2048.jpg`
- `https://threejs.org/examples/textures/planets/earth_clouds_1024.png`

Therefore, a network connection is required for the textured Earth unless those assets are later self-hosted.

### 7.3 Ocean model/depth curtain

The curtain is generated as a custom `THREE.BufferGeometry` from the current `gridData` matrix.

- Grid rows and columns become vertices distributed across a fixed Indian Ocean coordinate range.
- Latitude range used by the geometry: approximately -10 to 30 degrees.
- Longitude range used by the geometry: approximately 50 to 100 degrees.
- Vertex radius is displaced using the data value, `colorMin`, and `exaggeration`.
- Default exaggeration is `1.0`; default color range is 15 to 32.
- Vertex colors come from `getColorByPalette`.
- The surface uses a translucent Phong material with vertex colors and double-sided rendering.
- The curtain is visible only when `showModel` is true and display mode is `depthcurtain`.

The visible depth legend is an overlay centered near the bottom of the main view. It shows color transitions labeled 0m, 200m, 400m, 600m, and 800m. It is currently a static visual legend, not a dynamically generated scale from the active palette or data range.

### 7.4 ARGO markers

ARGO floats are rendered as labeled cyan spheres on the globe.

- Default marker core: cyan, approximately `#00ddff`.
- Hovered/selected marker: amber, larger, with a translucent aura.
- Each marker has a larger invisible hit target for easier pointer interaction.
- Labels use small monospace HTML overlays.
- Clicking a marker selects it and opens/pins the validation panel.
- Clicking the selected marker again clears the selection.
- Hovering shows a preview panel after the pointer enters the marker.
- Pointer exit is delayed by 400ms so users can move from a marker to the panel without losing the preview immediately.
- Selecting a marker moves the camera target toward the float location.
- Clicking empty canvas space clears the ARGO selection.

### 7.5 Metrics strip

Implemented in `frontend/src/components/UI/MetricsCards.tsx`.

A centered translucent pill at the top of the main scene shows:

- SST, green.
- SSH Anomaly, amber.
- Surface Wind, cyan.
- Embedding Zip, pink.

Metrics are fetched once on mount for a fixed point (`lat=17.25`, `lon=88.5`) and a fixed time (`27 Aug 2026 12:00 UTC`). They do not currently follow the selected region, depth, or time controls.

Fallback values are used if the metrics endpoint fails:

- SST: 28.4
- SSH anomaly: 8.12
- Surface wind: 6.8
- Embedding: `256 x 4`

The source currently contains an encoding artifact in the Celsius display string, so the UI may show `�C` instead of `°C` depending on rendering.

### 7.6 Mini-map

Implemented in `frontend/src/components/Map/MiniMap.tsx`.

- Size: 200px by 150px.
- Position: bottom-right of the main view, above the bottom toolbar.
- Uses a dark Carto basemap style.
- Center: longitude 80, latitude 15.
- Zoom: 4.
- Map interaction is disabled.
- Bottom overlay shows the selected variable, depth, and time.

The map itself does not currently pan, zoom, or draw the active region/model footprint. Its text overlay reacts to Zustand state.

### 7.7 Bottom control bar

Implemented in `frontend/src/components/Layout/BottomBar.tsx`.

The bottom bar is an 80px-high dark translucent control surface with horizontal scrolling enabled when its contents exceed the viewport.

Controls:

1. Time controller
   - Previous and next arrow buttons.
   - Current time text.
   - Play/pause button.
   - Play advances through the three configured timesteps every 2 seconds.
2. Depth
   - Current depth value in metres.
   - Range slider from 0 to 1000m in 5m steps.
3. Variable
   - Select control with Temperature, Salinity, and Chlorophyll.
4. Quick location
   - North Indian Ocean.
   - Arabian Sea.
   - Bay of Bengal.
   - Andaman Sea.
   - Lakshadweep Sea.

Region changes update the requested bounding box in `App.tsx`:

- North Indian Ocean: `50,-10,100,30`.
- Every other named region currently uses `65,5,90,25`.

The time controller and depth slider trigger new slice requests through the app-level data effect.

### 7.8 Validation drawer

Implemented in `frontend/src/components/UI/ValidationPanel.tsx`.

The drawer is 320px wide and appears when an ARGO float is hovered, selected, or when the pointer is over the panel. It contains:

- Float identifier and either `PINNED` or `HOVER PREVIEW` status.
- Close button.
- Latitude, longitude, and current time.
- Plotly vertical profile chart.
- Validation metrics versus ARGO.
- Thermocline depth and gradient.

When an active float is present, the frontend requests profile, comparison, and thermocline data in parallel. Results are cached in memory by float ID, variable, and time.

The panel clears profile and metrics when no float is active. A comparison failure displays `Comparison failed`. The chart is compact, approximately 160px tall, with a transparent dark theme, reversed depth axis, and no Plotly mode bar.

Validation metrics include:

- RMSE.
- Correlation.
- MAE.
- Bias.
- Matched point count when returned by the API.

Temperature values are displayed with degrees Celsius; salinity is plotted in PSU. Chlorophyll is available in the global variable state but the current profile chart only chooses temperature or salinity.

### 7.9 Learn/outreach modal

Implemented in `frontend/src/components/UI/LearnModal.tsx`.

The modal is a full-screen dark overlay with blur and a centered scrollable panel. It includes educational sections on:

- Subsurface intelligence.
- Thermocline dynamics.
- ARGO network validation.
- Interactive exploration instructions.

It is opened by the Outreach & Guide sidebar item and closed using either the header close control or the footer Close Guide button. The component contains some text encoding artifacts in emoji/degree-style characters that should be cleaned up if the file is edited.

## 8. State Model

Global state is defined in `frontend/src/store/oceanStore.ts` and managed with Zustand.

Core defaults:

```text
variable: temperature
depth: 125
time: 27 Aug 2026 12:00 UTC
region: North Indian Ocean
displayMode: depthcurtain
palette: thermal
colorMin: 15
colorMax: 32
exaggeration: 1.0
isPlaying: false
opacity: 0.85
showModel: true
showArgo: true
showCurrents: false
showThermocline: false
showGrid: false
showCoastlines: true
```

Default time steps:

- `28 Aug 2026`
- `29 Aug 2026`
- `30 Aug 2026`

Default depths:

- 0, 10, 25, 50, 100, 200, 500, 1000m

State is not persisted to local storage. A browser refresh resets the application to defaults.

Some state fields have actions but no active UI control yet:

- Palette.
- Color range.
- Exaggeration.
- Opacity.
- Thermocline toggle.
- Grid toggle.
- Coastline toggle.
- Dynamic timesteps/depths.

## 9. Frontend Data Flow

### Initial load

`App.tsx` starts two effects:

1. Fetch ARGO floats for the current region and time.
2. Fetch the ocean slice for the current variable, depth, time, and region.

The slice effect sets loading true, clears the prior error, requests data, and stores the returned matrix/latitudes/longitudes. If the request fails or returns no data, it stores an error and creates a synthetic 40x50 fallback grid. Loading is cleared in a `finally` block.

### State changes

Changing variable, depth, time, or region retriggers the slice request. Changing region or time retriggers the ARGO float request.

### Animation

The bottom play control advances the app time through the three `timesteps` values every 2 seconds. The 3D scene also changes depth on an oscillating loop while playing, between 0 and 500m. This means playback changes both time and depth, but the depth behavior is implemented separately from the bottom bar timer.

### API fallback behavior

The frontend API client catches most request errors and returns synthetic values. This allows the visualization to remain usable when the backend is offline, but it can conceal API failures unless the slice effect's own error state is inspected.

## 10. Backend API Contract

The FastAPI app is registered at `/api/v1`, `/api`, and the root path for compatibility. The canonical frontend base URL is:

```text
http://localhost:8000/api/v1
```

Implemented canonical endpoints:

- `GET /api/v1/timesteps`
- `GET /api/v1/depths`
- `GET /api/v1/dataset`
- `GET /api/v1/slice`
- `GET /api/v1/argo/floats`
- `GET /api/v1/argo/{float_id}/profile`
- `POST /api/v1/compare`
- `GET /api/v1/thermocline`
- `GET /api/v1/metrics`

Slice query parameters:

```text
variable=temperature|salinity|chlorophyll
depth=<metres>
time=<ISO-like date/time string>
bbox=lon_min,lat_min,lon_max,lat_max
```

ARGO float query parameters:

```text
region=<named region>
time=<date/time string>
```

Comparison query parameters:

```text
float_id=<ARGO id>
variable=temperature|salinity
time=<date/time string>
```

Thermocline query parameters:

```text
float_id=<ARGO id>
variable=<variable>
time=<date/time string>
```

Metrics query parameters:

```text
lat=<latitude>
lon=<longitude>
time=<date/time string>
```

The README mentions `/metadata`, `/profile`, and `/argo/profile/{wmo}` style routes, but the current implementation uses `/dataset`, `/argo/{float_id}/profile`, and the other routes listed above. Treat `backend/app/api/routes.py` as the source of truth.

## 11. Scientific/Visualization Behavior

### Color palettes

`frontend/src/utils/colorUtils.ts` maps normalized data values to Three.js colors using Chroma.js.

Available palettes:

- `thermal`: blue -> cyan -> yellow -> red.
- `viridis`: purple -> blue -> teal -> green -> yellow.
- `plasma`: deep blue -> purple -> pink -> orange -> yellow.
- `blues`: dark blue -> blue -> light blue.

The current UI does not expose a palette selector even though the state and utility support it.

### Thermocline

The backend uses the ARGO profile to detect a thermocline depth and gradient. The current frontend displays the returned values in the validation panel. The 3D thermocline ring is controlled by `showThermocline`, but there is no visible control wired to that state in the current UI.

### Model comparison

The backend compares model profiles against ARGO observations and returns RMSE, bias, correlation, MAE, matched points, and optional error information. The frontend displays these metrics in the validation drawer.

## 12. Responsive and Accessibility Notes

The design is primarily optimized for a desktop viewport with a fixed 260px sidebar, central canvas, optional 320px validation drawer, and a wide bottom toolbar.

Current responsive behavior is limited:

- The root application uses `100vw`, `100vh`, and fixed grid columns.
- The bottom bar can scroll horizontally, but the sidebar and validation drawer do not have mobile-specific layouts.
- Metrics, mini-map, legend, and loading overlays use fixed dimensions/offsets.
- The validation drawer may consume most of a narrow viewport.
- Navigation items are clickable `<div>` elements rather than semantic buttons.
- Several icon-only controls use text glyphs and do not consistently expose accessible labels.
- The 3D scene depends on WebGL and remote texture loading.

Any future mobile pass should preserve the scientific density while replacing the fixed three-column desktop composition with a collapsible rail, bottom sheet, or tabbed inspection panel.

## 13. Known Gaps and Risks

- Docker access depends on local Docker socket permissions.
- The bundled Python virtual environment may be incomplete; install `backend/requirements.txt` into an appropriate environment before running the API.
- The frontend currently hard-codes `http://localhost:8000`; an environment-based API URL would make deployment safer.
- The backend CORS list includes `*` alongside explicit origins and should be tightened for production.
- Frontend and backend time defaults are inconsistent: the store starts at `27 Aug 2026 12:00 UTC`, while the default timestep list is 28-30 Aug 2026.
- The API client and app fallback data can make a failed backend look like a successful synthetic-data session.
- The README endpoint table is stale in places; use `backend/app/api/routes.py` as the authoritative contract.
- Several sidebar modes do not have corresponding rendered views.
- `showCurrents` is toggled but no current vectors are rendered in `EarthScene`.
- `showCoastlines`, opacity, palette, color range, and exaggeration are not all surfaced as usable controls.
- Mini-map context is static and does not show ARGO markers or the active region geometry.
- Metrics are fetched for a fixed location/time rather than the current exploration state.
- The 3D data geometry uses hard-coded coordinates rather than the returned `lats` and `lons` arrays.
- The depth legend is static and does not reflect the selected palette or active range.
- Plotly substantially increases the production bundle size; code splitting would improve initial load time.
- Several source files contain encoding artifacts such as `�` or `??` in visible UI strings.
- No automated frontend or backend test suite is currently documented in the repository.

## 14. Safe UI/UX Extension Guidelines

When extending this project:

1. Keep the full-screen scientific workspace as the primary experience.
2. Reuse the existing near-black navy surfaces, cyan interaction accent, monospace labels, and color-coded scientific values.
3. Preserve the left rail, central globe, optional right inspection drawer, and bottom control bar unless a responsive redesign is intentional.
4. Use Zustand for cross-component state rather than introducing local duplicated state for shared controls.
5. Add a real view renderer before adding a sidebar mode; setting `displayMode` alone does not create a new page.
6. Keep loading, fallback, and API error states visible and distinguishable.
7. Prefer semantic buttons and labels for new controls while matching the compact visual language.
8. Use the existing API client helpers and backend route names rather than adding duplicate request logic.
9. Avoid relying on remote assets for critical content without a fallback or local copy.
10. Validate at desktop and narrow viewport sizes because fixed overlays and the right drawer can overlap on small screens.

## 15. Useful Source References

- Main application composition: `frontend/src/App.tsx`
- Global state: `frontend/src/store/oceanStore.ts`
- 3D scene: `frontend/src/components/3D/EarthScene.tsx`
- Navigation: `frontend/src/components/Layout/Sidebar.tsx`
- Bottom controls: `frontend/src/components/Layout/BottomBar.tsx`
- ARGO inspection drawer: `frontend/src/components/UI/ValidationPanel.tsx`
- Profile chart: `frontend/src/components/UI/ProfileChart.tsx`
- Guide modal: `frontend/src/components/UI/LearnModal.tsx`
- Metric strip: `frontend/src/components/UI/MetricsCards.tsx`
- Mini-map: `frontend/src/components/Map/MiniMap.tsx`
- API client and frontend fallbacks: `frontend/src/api/oceanApi.ts`
- Color mapping: `frontend/src/utils/colorUtils.ts`
- Backend endpoints: `backend/app/api/routes.py`
- Backend app setup: `backend/app/main.py`
- Backend settings: `backend/app/core/config.py`
