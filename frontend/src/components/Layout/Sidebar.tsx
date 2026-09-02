import React from 'react';
import { useOceanStore } from '../../store/oceanStore';

const menuItems = [
  { id: 'live', label: 'Live Ocean', icon: '??' },
  { id: '3dglobe', label: '3D Globe', icon: '??' },
  { id: 'depthcurtain', label: 'Depth Curtain', icon: '??' },
  { id: 'profile', label: 'Temperature Profile', icon: '???' },
  { id: 'currents', label: 'Currents', icon: '???' },
  { id: 'argo', label: 'ARGO Floats', icon: '??' },
  { id: 'ai', label: 'AI Reconstruction', icon: '??' },
  { id: 'validation', label: 'Validation', icon: '?' },
  { id: 'sources', label: 'Data Sources', icon: '??' },
  { id: 'analytics', label: 'Analytics', icon: '??' },
  { id: 'settings', label: 'Settings', icon: '??' },
];

interface SidebarProps {
  onOpenLearn?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenLearn }) => {
  const { displayMode, setDisplayMode } = useOceanStore();

  const pipeline = [
    { label: 'Data Ingestion', status: 'completed' },
    { label: 'Satellite Processing', status: 'completed' },
    { label: 'AI Encoding', status: 'completed' },
    { label: 'Embedding', status: 'completed' },
    { label: 'Reconstruction', status: 'inprogress', progress: 76 },
    { label: 'Validation', status: 'pending' },
  ];

  return (
    <div style={{
      gridArea: 'sidebar',
      background: 'rgba(8, 12, 25, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRight: '1px solid rgba(0, 200, 255, 0.08)',
      padding: '20px 0',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflowY: 'auto'
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <span style={{ color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 }}>OCEAN-X</span>
        <div style={{ color: '#445566', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          Subsurface Intelligence - Ocean Insight
        </div>
      </div>

      {/* Outreach Mode Button */}
      {onOpenLearn && (
        <div style={{ padding: '0 16px', marginBottom: 16 }}>
          <button
            onClick={onOpenLearn}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, rgba(0, 170, 255, 0.2), rgba(0, 255, 170, 0.2))',
              border: '1px solid #00ddff',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#00ddff',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 0 10px rgba(0, 221, 255, 0.2)'
            }}
          >
            <span>??</span> Outreach & Guide
          </button>
        </div>
      )}

      {/* Menu */}
      <div style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setDisplayMode(item.id as any)}
            style={{
              padding: '10px 20px',
              margin: '2px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: displayMode === item.id ? 'rgba(0, 170, 255, 0.12)' : 'transparent',
              borderLeft: displayMode === item.id ? '3px solid #00aaff' : '3px solid transparent',
              color: displayMode === item.id ? '#ffffff' : '#8899bb',
              fontSize: 13,
              fontFamily: 'monospace'
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      {/* API Pipeline Status */}
      <div style={{ borderTop: '1px solid rgba(0,200,255,0.08)', padding: '16px 20px' }}>
        <div style={{ color: '#88ccff', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          API Pipeline Status
        </div>
        {pipeline.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{
              color: step.status === 'completed' ? '#00ff88' : step.status === 'inprogress' ? '#ffaa44' : '#445566',
              fontSize: 12
            }}>
              {step.status === 'completed' ? '?' : step.status === 'inprogress' ? '?' : '?'}
            </span>
            <span style={{ color: step.status === 'pending' ? '#445566' : '#8899bb', fontSize: 11 }}>
              {step.label}
            </span>
            {step.progress && (
              <>
                <span style={{ color: '#ffaa44', fontSize: 10, marginLeft: 'auto' }}>{step.progress}%</span>
                <div style={{ width: 40, height: 4, background: '#1a2a3a', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${step.progress}%`, height: '100%', background: '#00aaff' }} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(0,200,255,0.08)', padding: '12px 20px' }}>
        <div style={{ color: '#445566', fontSize: 10, textAlign: 'center' }}>
          OceanEmbed v1.0<br />
          INCOIS · SIH 2026
        </div>
      </div>
    </div>
  );
};
