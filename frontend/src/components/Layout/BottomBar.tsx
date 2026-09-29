import React from 'react';
import { ChevronLeft, ChevronRight, MapPin, Pause, Play } from 'lucide-react';
import { useOceanStore } from '../../store/oceanStore';

const regions = ['North Indian Ocean', 'Arabian Sea', 'Bay of Bengal', 'Andaman Sea', 'Lakshadweep Sea'];
const depthPresets = [0, 50, 100, 200, 500, 1000];

export const BottomBar = () => {
  const {
    time, setTime, depth, setDepth, isPlaying, togglePlay,
    region, setRegion, variable, setVariable, timesteps,
  } = useOceanStore();

  const idx = timesteps.indexOf(time);
  const goPrev = () => { if (idx > 0) setTime(timesteps[idx - 1]); };
  const goNext = () => { if (idx < timesteps.length - 1) setTime(timesteps[idx + 1]); };

  return (
    <div className="exploration-dock" aria-label="Exploration controls">
      <div className="dock-group dock-time">
        <span className="dock-label">TIME</span>
        <div className="time-control">
          <button type="button" onClick={goPrev} aria-label="Previous time step" title="Previous time step"><ChevronLeft size={16} /></button>
          <span className="time-value">{time}</span>
          <button type="button" onClick={goNext} aria-label="Next time step" title="Next time step"><ChevronRight size={16} /></button>
          <button type="button" className={`play-button${isPlaying ? ' active' : ''}`} onClick={togglePlay} aria-label={isPlaying ? 'Pause playback' : 'Play timeline'} title={isPlaying ? 'Pause timeline' : 'Play timeline'}>
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          </button>
        </div>
        <div className="timeline-track" aria-hidden="true"><span style={{ width: `${timesteps.length > 1 ? (Math.max(idx, 0) / (timesteps.length - 1)) * 100 : 0}%` }} /></div>
      </div>

      <div className="dock-group depth-control">
        <div className="dock-heading"><span className="dock-label">DEPTH</span><strong>{depth} m</strong></div>
        <input aria-label="Depth in metres" type="range" min="0" max="1000" step="5" value={depth} onChange={(event) => setDepth(parseInt(event.target.value, 10))} />
        <div className="depth-presets" aria-label="Depth presets">
          {depthPresets.map((preset) => <button type="button" key={preset} className={depth === preset ? 'selected' : ''} onClick={() => setDepth(preset)}>{preset}m</button>)}
        </div>
      </div>

      <div className="dock-group compact-control">
        <label className="dock-label" htmlFor="variable-select">VARIABLE</label>
        <select id="variable-select" value={variable} onChange={(event) => setVariable(event.target.value as 'temperature' | 'salinity' | 'chlorophyll')}>
          <option value="temperature">Temperature</option>
          <option value="salinity">Salinity</option>
          <option value="chlorophyll">Chlorophyll</option>
        </select>
      </div>

      <div className="dock-group compact-control region-control">
        <label className="dock-label" htmlFor="region-select"><MapPin size={13} /> REGION</label>
        <select id="region-select" value={region} onChange={(event) => setRegion(event.target.value as typeof region)}>
          {regions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
    </div>
  );
};
