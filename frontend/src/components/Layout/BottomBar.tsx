import React from 'react';
import { useOceanStore } from '../../store/oceanStore';

export const BottomBar = () => {
  const {
    time, setTime, depth, setDepth, isPlaying, togglePlay,
    region, setRegion, variable, setVariable, timesteps
  } = useOceanStore();

  const idx = timesteps.indexOf(time);
  const goPrev = () => { if (idx > 0) setTime(timesteps[idx - 1]); };
  const goNext = () => { if (idx < timesteps.length - 1) setTime(timesteps[idx + 1]); };

  const regions = ['North Indian Ocean', 'Arabian Sea', 'Bay of Bengal', 'Andaman Sea', 'Lakshadweep Sea'];

  return (
    <div style={{
      gridArea: 'bottom',
      background: 'rgba(8, 12, 25, 0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(0, 200, 255, 0.08)',
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      gap: 12
    }}>
      {/* TIME CONTROLLER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#88ccff', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>
          TIME CONTROLLER
        </span>
        <button onClick={goPrev} style={{ background: 'transparent', border: 'none', color: '#88ccff', cursor: 'pointer' }}>?</button>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: 13, minWidth: 100 }}>{time}</span>
        <button onClick={goNext} style={{ background: 'transparent', border: 'none', color: '#88ccff', cursor: 'pointer' }}>?</button>
        <button onClick={togglePlay} style={{
          background: isPlaying ? 'rgba(255,80,40,0.2)' : 'rgba(0,170,255,0.2)',
          border: `1px solid ${isPlaying ? '#ff6644' : '#00aaff'}`,
          borderRadius: 20,
          padding: '2px 14px',
          color: 'white',
          cursor: 'pointer',
          fontSize: 10
        }}>
          {isPlaying ? '? PAUSE' : '? PLAY'}
        </button>
      </div>

      {/* DEPTH */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#88ccff', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>DEPTH</span>
        <span style={{ color: 'white', fontSize: 13, fontWeight: 'bold', minWidth: 40 }}>{depth}m</span>
        <input
          type="range"
          min="0"
          max="1000"
          step="5"
          value={depth}
          onChange={(e) => setDepth(parseInt(e.target.value))}
          style={{ width: 100, accentColor: '#00aaff' }}
        />
      </div>

      {/* VARIABLE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#88ccff', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>VARIABLE</span>
        <select
          value={variable}
          onChange={(e) => setVariable(e.target.value as any)}
          style={{
            background: 'rgba(0,0,0,0.4)',
            color: 'white',
            border: '1px solid #334466',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 11,
            fontFamily: 'monospace'
          }}
        >
          <option value="temperature">Temperature</option>
          <option value="salinity">Salinity</option>
          <option value="chlorophyll">Chlorophyll</option>
        </select>
      </div>

      {/* QUICK LOCATION */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#88ccff', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginRight: 4 }}>
          QUICK LOCATION
        </span>
        {regions.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r as any)}
            style={{
              background: region === r ? 'rgba(0,170,255,0.2)' : 'transparent',
              border: region === r ? '1px solid #00aaff' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: 20,
              padding: '2px 12px',
              color: region === r ? 'white' : '#8899bb',
              fontSize: 9,
              cursor: 'pointer',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap'
            }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
};
