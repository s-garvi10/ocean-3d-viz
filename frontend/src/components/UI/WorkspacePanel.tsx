import React from 'react';
import { Activity, BarChart3, BrainCircuit, CheckCircle2, Database, Layers3, Settings2, Wind, X } from 'lucide-react';
import { useOceanStore } from '../../store/oceanStore';

const modeCopy: Record<string, { title: string; description: string }> = {
  profile: { title: 'Temperature profile', description: 'Inspect a vertical observation profile from a selected ARGO float.' },
  currents: { title: 'Currents', description: 'Current vectors require a velocity field in the active dataset.' },
  argo: { title: 'ARGO floats', description: 'Select a float to open its profile, validation metrics, and thermocline estimate.' },
  validation: { title: 'Validation', description: 'Compare the loaded model slice against an ARGO observation.' },
  ai: { title: 'AI reconstruction', description: 'Monitor the reconstruction stages reported by the current data pipeline.' },
  analytics: { title: 'Analytics', description: 'Review summary statistics for the loaded ocean slice.' },
  sources: { title: 'Data sources', description: 'Review the datasets and services currently connected to this workspace.' },
  settings: { title: 'Settings', description: 'Tune the visualization without changing the underlying scientific calculations.' },
};

const pipeline = [
  ['Data ingestion', 'Complete'],
  ['Satellite processing', 'Complete'],
  ['AI encoding', 'Complete'],
  ['Embedding', 'Complete'],
  ['Reconstruction', '76%'],
  ['Validation', 'Pending'],
];

export const WorkspacePanel = () => {
  const state = useOceanStore();
  const { displayMode } = state;
  const copy = modeCopy[displayMode];
  if (!copy) return null;

  return (
    <section className="workspace-panel" aria-labelledby="workspace-panel-title">
      <header className="workspace-panel-header">
        <div>
          <span className="eyebrow"><PanelIcon mode={displayMode} /> WORKSPACE</span>
          <h2 id="workspace-panel-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <button type="button" className="icon-button" onClick={() => state.setDisplayMode('depthcurtain')} aria-label="Close workspace panel" title="Close panel"><X size={16} /></button>
      </header>
      {displayMode === 'argo' && <ArgoView />}
      {displayMode === 'validation' && <ValidationView />}
      {displayMode === 'profile' && <ProfileView />}
      {displayMode === 'currents' && <CurrentsView />}
      {displayMode === 'ai' && <PipelineView />}
      {displayMode === 'analytics' && <AnalyticsView />}
      {displayMode === 'sources' && <SourcesView />}
      {displayMode === 'settings' && <SettingsView />}
    </section>
  );
};

const PanelIcon = ({ mode }: { mode: string }) => {
  const Icon = mode === 'currents' ? Wind : mode === 'analytics' ? BarChart3 : mode === 'sources' ? Database : mode === 'settings' ? Settings2 : mode === 'ai' ? BrainCircuit : mode === 'validation' ? CheckCircle2 : mode === 'profile' ? Activity : Layers3;
  return <Icon size={14} aria-hidden="true" />;
};

const ArgoView = () => {
  const { argoFloats, selectedArgoId, selectArgo } = useOceanStore();
  return (
    <div className="workspace-list">
      {argoFloats.length === 0 && <p className="workspace-muted">No ARGO floats are available for this region and time.</p>}
      {argoFloats.map((float: any) => (
        <button type="button" className={`float-row${selectedArgoId === float.id ? ' selected' : ''}`} key={float.id} onClick={() => selectArgo(selectedArgoId === float.id ? null : float.id)}>
          <span><strong>{float.id}</strong><small>{float.lat.toFixed(2)}° N · {float.lon.toFixed(2)}° E</small></span>
          <span className="float-depth">{float.depth ?? '—'}m</span>
        </button>
      ))}
    </div>
  );
};

const ValidationView = () => {
  const { selectedArgoId, argoFloats, selectArgo } = useOceanStore();
  return (
    <div className="workspace-callout">
      <CheckCircle2 size={20} />
      <div>
        <strong>{selectedArgoId ? `Inspecting ${selectedArgoId}` : 'Choose an ARGO float'}</strong>
        <p>{selectedArgoId ? 'The scientific inspector is open on the right.' : 'Select a float below or click a marker on the globe.'}</p>
      </div>
      {!selectedArgoId && argoFloats[0] && <button type="button" className="workspace-action" onClick={() => selectArgo(argoFloats[0].id)}>Open first float</button>}
    </div>
  );
};

const ProfileView = () => {
  const { selectedArgoId } = useOceanStore();
  return <div className="workspace-callout"><Activity size={20} /><div><strong>{selectedArgoId ? `Profile ready for ${selectedArgoId}` : 'Select an ARGO float to view a profile'}</strong><p>Profiles are loaded from the ARGO endpoint and shown in the inspector after selection.</p></div></div>;
};

const CurrentsView = () => {
  const { showCurrents, toggleLayer } = useOceanStore();
  return (
    <div className="workspace-callout warning-callout"><Wind size={20} /><div><strong>Velocity data unavailable</strong><p>The current NetCDF dataset contains scalar fields only, so no current vectors are drawn.</p><button type="button" className="workspace-action" onClick={() => toggleLayer('showCurrents')}>{showCurrents ? 'Mark layer off' : 'Mark layer on'}</button></div></div>
  );
};

const PipelineView = () => <div className="pipeline-list">{pipeline.map(([label, status]) => <div className="pipeline-row" key={label}><span className={status === 'Complete' ? 'complete' : status === 'Pending' ? 'pending' : 'active'}>{status === 'Complete' ? '✓' : status === 'Pending' ? '○' : '◐'}</span><span>{label}</span><strong>{status}</strong></div>)}</div>;

const AnalyticsView = () => {
  const { gridData, variable, depth, region, dataSource } = useOceanStore();
  const values = gridData.flat().filter((value) => Number.isFinite(value));
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  return <div className="analytics-grid"><Stat label="Variable" value={variable} /><Stat label="Depth" value={`${depth}m`} /><Stat label="Grid" value={values.length ? `${gridData.length} × ${gridData[0]?.length ?? 0}` : '—'} /><Stat label="Minimum" value={min === null ? '—' : min.toFixed(2)} /><Stat label="Mean" value={mean === null ? '—' : mean.toFixed(2)} /><Stat label="Maximum" value={max === null ? '—' : max.toFixed(2)} /><p className="workspace-note">{region} · {dataSource === 'live' ? 'Live API data' : 'Synthetic demo data'}</p></div>;
};

const SourcesView = () => <div className="source-list"><div><strong>Ocean model</strong><span>backend/data/sample_ocean_data.nc</span></div><div><strong>ARGO observations</strong><span>backend/data/demo_argo.nc or API adapter</span></div><div><strong>Surface basemap</strong><span>Carto dark matter via MapLibre</span></div><div><strong>API</strong><span>GET /api/v1/slice · /argo · /metrics</span></div></div>;

const SettingsView = () => {
  const { palette, setPalette, colorMin, colorMax, setColorRange, exaggeration, setExaggeration, opacity, setOpacity, showGrid, showThermocline, toggleLayer } = useOceanStore();
  return <div className="settings-list"><label>Color palette<select value={palette} onChange={(event) => setPalette(event.target.value)}><option value="thermal">Thermal</option><option value="viridis">Viridis</option><option value="plasma">Plasma</option><option value="blues">Blues</option></select></label><label>Color minimum<input type="number" value={colorMin} onChange={(event) => setColorRange(Number(event.target.value), colorMax)} /></label><label>Color maximum<input type="number" value={colorMax} onChange={(event) => setColorRange(colorMin, Number(event.target.value))} /></label><label>Depth exaggeration<input type="range" min="0.2" max="3" step="0.1" value={exaggeration} onChange={(event) => setExaggeration(Number(event.target.value))} /><span>{exaggeration.toFixed(1)}×</span></label><label>Surface opacity<input type="range" min="0.2" max="1" step="0.05" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /><span>{Math.round(opacity * 100)}%</span></label><div className="toggle-list"><button type="button" onClick={() => toggleLayer('showGrid')}>{showGrid ? '✓' : '○'} Coordinate grid</button><button type="button" onClick={() => toggleLayer('showThermocline')}>{showThermocline ? '✓' : '○'} Thermocline ring</button></div></div>;
};

const Stat = ({ label, value }: { label: string; value: string }) => <div className="workspace-stat"><span>{label}</span><strong>{value}</strong></div>;
