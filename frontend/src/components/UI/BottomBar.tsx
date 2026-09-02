import React, { useEffect, useState } from 'react';
import { useOceanStore } from '../../store/oceanStore';
import { fetchTimesteps } from '../../api/oceanApi';

export const BottomBar = () => {
  const { depth, variable, isPlaying, togglePlay, setDepth, time, setTime } = useOceanStore();
  const [timesteps, setTimesteps] = useState<string[]>(['2026-08-28', '2026-08-29', '2026-08-30']);
  
  useEffect(() => {
    fetchTimesteps().then(setTimesteps).catch(() => console.log('Using fallback timesteps'));
  }, []);

  const idx = timesteps.indexOf(time);
  const goPrev = () => { if (idx > 0) setTime(timesteps[idx-1]); };
  const goNext = () => { if (idx < timesteps.length - 1) setTime(timesteps[idx+1]); };

  return (
    <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: 'rgba(5, 10, 25, 0.8)', backdropFilter: 'blur(20px)', padding: '12px 28px', borderRadius: 60, border: '1px solid rgba(0, 200, 255, 0.2)', display: 'flex', gap: 25, alignItems: 'center', color: '#aabbdd', fontFamily: 'monospace', fontSize: 13, boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
      <span style={{ color: '#88ccff' }}>🌏 INDIAN OCEAN SECTOR</span>
      <div style={{ width: 1, height: 20, background: '#334466' }} />
      <button onClick={goPrev} style={{ background: 'transparent', border: 'none', color: '#88ccff', cursor: 'pointer', fontSize: 14 }} title="Previous date">◀</button>
      <span style={{ color: 'white', fontWeight: 'bold', minWidth: 80, textAlign: 'center' }}>{time}</span>
      <button onClick={goNext} style={{ background: 'transparent', border: 'none', color: '#88ccff', cursor: 'pointer', fontSize: 14 }} title="Next date">▶</button>
      <div style={{ width: 1, height: 20, background: '#334466' }} />
      <span>DEPTH: <span style={{ color: 'white', fontWeight: 'bold' }}>{depth}m</span></span>
      <span style={{ textTransform: 'uppercase' }}>{variable}</span>
      <button onClick={togglePlay} style={{ background: 'transparent', border: 'none', color: '#88ccff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center' }} title={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? '⏸' : '▶'}</button>
      <div style={{ width: 1, height: 20, background: '#334466' }} />
      <input type="range" min="0" max="500" step="10" value={depth} onChange={(e) => setDepth(parseInt(e.target.value) || 0)} style={{ width: 120, accentColor: '#00aaff', cursor: 'pointer' }} />
    </div>
  );
};
