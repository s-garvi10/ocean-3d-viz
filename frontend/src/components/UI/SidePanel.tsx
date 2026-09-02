import React from 'react';
import { useOceanStore } from '../../store/oceanStore';
import { getPaletteGradient } from '../../utils/colorUtils';

export const SidePanel = () => {
  const { palette, setPalette, colorMin, colorMax, setColorRange, exaggeration, setExaggeration, showPanel } = useOceanStore();
  if (!showPanel) return null;
  return (
    <div style={{ position: 'absolute', top: 80, left: 20, zIndex: 20, background: 'rgba(10, 20, 40, 0.75)', backdropFilter: 'blur(24px)', padding: '24px 20px', borderRadius: 16, border: '1px solid rgba(0, 200, 255, 0.15)', width: 220, boxShadow: '0 20px 60px rgba(0,0,0,0.8)', color: '#c0d0e0', fontFamily: 'monospace' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#88ccff', marginBottom: 16 }}>Visualization</div>
      <label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Palette</label>
      <select value={palette} onChange={(e) => setPalette(e.target.value as any)} style={{ width: '100%', padding: 6, background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid #334466', borderRadius: 6, marginBottom: 16 }}>
        <option value="thermal">Thermal</option>
        <option value="viridis">Viridis</option>
        <option value="plasma">Plasma</option>
        <option value="blues">Blues</option>
      </select>
      <label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Color Range</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="number" value={colorMin} onChange={(e) => setColorRange(parseFloat(e.target.value) || 0, colorMax)} style={{ width: 60, padding: 4, background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid #334466', borderRadius: 4 }} />
        <span style={{ color: '#556688' }}>—</span>
        <input type="number" value={colorMax} onChange={(e) => setColorRange(colorMin, parseFloat(e.target.value) || 1)} style={{ width: 60, padding: 4, background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid #334466', borderRadius: 4 }} />
      </div>
      <div style={{ height: 12, background: `linear-gradient(to right, ${getPaletteGradient(palette)})`, borderRadius: 4, marginTop: 8, marginBottom: 16 }} />
      <label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Vertical Exaggeration</label>
      <input type="range" min="0.1" max="3.0" step="0.1" value={exaggeration} onChange={(e) => setExaggeration(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#00aaff' }} />
      <div style={{ textAlign: 'right', fontSize: 12, color: '#88ccff', marginTop: 4 }}>{exaggeration.toFixed(1)}x</div>
    </div>
  );
};
