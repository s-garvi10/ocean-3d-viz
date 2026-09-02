import React from 'react';
import { useOceanStore } from '../../store/oceanStore';

const menuItems = [
  { id: 'live', label: 'Live Ocean', icon: '🌊', action: 'reset' },
  { id: '3dglobe', label: '3D Globe', icon: '🌍', action: 'globe' },
  { id: 'depthcurtain', label: 'Depth Curtain', icon: '📊', action: 'curtain' },
  { id: 'profile', label: 'Temperature Profile', icon: '🌡️', action: 'profile' },
  { id: 'currents', label: 'Currents', icon: '🌪️', action: 'currents' },
  { id: 'argo', label: 'ARGO Floats', icon: '🤿', action: 'argo' },
  { id: 'ai', label: 'AI Reconstruction', icon: '🧠', action: 'ai' },
  { id: 'validation', label: 'Validation', icon: '✅', action: 'validation' },
  { id: 'sources', label: 'Data Sources', icon: '📂', action: 'sources' },
  { id: 'analytics', label: 'Analytics', icon: '📈', action: 'analytics' },
  { id: 'settings', label: 'Settings', icon: '⚙️', action: 'settings' },
];

interface SidebarProps {
  onOpenLearn?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenLearn }) => {
  const {
    displayMode,
    setDisplayMode,
    setVariable,
    setDepth,
    setTime,
    toggleLayer,
    showArgo,
    showCurrents,
    showModel,
  } = useOceanStore();

  // ---- THE MAGIC: This makes every button actually WORK ----
  const handleMenuClick = (item: any) => {
    switch (item.action) {
      case 'reset':
        // Reset to default Live Ocean view
        setDisplayMode('live');
        setVariable('temperature');
        setDepth(100);
        setTime('28 Aug 2026 12:00 UTC');
        // Ensure layers are on
        if (!showModel) toggleLayer('showModel');
        if (!showArgo) toggleLayer('showArgo');
        break;

      case 'globe':
        // Show pure 3D Earth without the depth curtain
        setDisplayMode('3dglobe');
        if (showModel) toggleLayer('showModel'); // Hide curtain
        break;

      case 'curtain':
        // Show the Depth Curtain (extruded prism)
        setDisplayMode('depthcurtain');
        if (!showModel) toggleLayer('showModel'); // Show curtain
        break;

      case 'profile':
        // Switch to Temperature AND open profile view
        setDisplayMode('profile');
        setVariable('temperature');
        // This triggers the right panel to show the profile chart
        break;

      case 'currents':
        // Toggle Currents layer ON/OFF (fetches U/V data)
        setDisplayMode('currents');
        toggleLayer('showCurrents');
        break;

      case 'argo':
        // Toggle Argo Float markers ON/OFF
        setDisplayMode('argo');
        toggleLayer('showArgo');
        break;

      case 'ai':
        // Open AI Reconstruction panel (or toggle)
        setDisplayMode('ai');
        // You can add a modal or panel logic here
        alert('🧠 AI Reconstruction: Click "Run Demo" to see 76% progress simulation.');
        break;

      case 'validation':
        // Open Validation Metrics panel
        setDisplayMode('validation');
        // Force right panel to show if Argo is selected, else prompt
        break;

      case 'sources':
        setDisplayMode('sources');
        alert('📂 Data Sources:\n- INCOIS HYCOM (Model)\n- NOAA OISST (SST)\n- Argovis (Argo)\n- EGO Glider (Glider)');
        break;

      case 'analytics':
        setDisplayMode('analytics');
        alert('📈 Analytics: RMSE, Bias, Correlation, Thermocline depth computed live from model vs Argo.');
        break;

      case 'settings':
        setDisplayMode('settings');
        alert('⚙️ Settings: Toggle vertical exaggeration, color palettes, and opacity in the left panel.');
        break;

      default:
        setDisplayMode(item.id);
    }
  };

  const pipeline = [
    { label: 'Data Ingestion', status: 'completed' },
    { label: 'Satellite Processing', status: 'completed' },
    { label: 'AI Encoding', status: 'completed' },
    { label: 'Embedding', status: 'completed' },
    { label: 'Reconstruction', status: 'inprogress', progress: 76 },
    { label: 'Validation', status: 'pending' },
  ];

  // Helper to check if a menu item is "active"
  const isActive = (item: any) => {
    if (item.action === 'curtain' && displayMode === 'depthcurtain') return true;
    if (item.action === 'globe' && displayMode === '3dglobe') return true;
    if (item.action === 'argo' && displayMode === 'argo') return true;
    if (item.action === 'currents' && displayMode === 'currents') return true;
    if (item.action === 'profile' && displayMode === 'profile') return true;
    if (item.action === 'validation' && displayMode === 'validation') return true;
    if (item.id === displayMode) return true;
    return false;
  };

  return (
    <div
      style={{
        gridArea: 'sidebar',
        background: 'rgba(8, 12, 25, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(0, 200, 255, 0.08)',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <span style={{ color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 }}>
          OCEAN-X
        </span>
        <div
          style={{
            color: '#445566',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
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
              boxShadow: '0 0 10px rgba(0, 221, 255, 0.2)',
            }}
          >
            <span>📖</span> Outreach & Guide
          </button>
        </div>
      )}

      {/* Menu Items */}
      <div style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleMenuClick(item)}
            style={{
              padding: '10px 20px',
              margin: '2px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: isActive(item) ? 'rgba(0, 170, 255, 0.12)' : 'transparent',
              borderLeft: isActive(item) ? '3px solid #00aaff' : '3px solid transparent',
              color: isActive(item) ? '#ffffff' : '#8899bb',
              fontSize: 13,
              fontFamily: 'monospace',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {/* Show a small status dot for toggles */}
            {item.action === 'argo' && (
              <span
                style={{
                  marginLeft: 'auto',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: showArgo ? '#00ff88' : '#445566',
                }}
              />
            )}
            {item.action === 'currents' && (
              <span
                style={{
                  marginLeft: 'auto',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: showCurrents ? '#44ccff' : '#445566',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* API Pipeline Status */}
      <div style={{ borderTop: '1px solid rgba(0,200,255,0.08)', padding: '16px 20px' }}>
        <div
          style={{
            color: '#88ccff',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          API Pipeline Status
        </div>
        {pipeline.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              style={{
                color:
                  step.status === 'completed'
                    ? '#00ff88'
                    : step.status === 'inprogress'
                    ? '#ffaa44'
                    : '#445566',
                fontSize: 12,
              }}
            >
              {step.status === 'completed' ? '✓' : step.status === 'inprogress' ? '⏳' : '○'}
            </span>
            <span style={{ color: step.status === 'pending' ? '#445566' : '#8899bb', fontSize: 11 }}>
              {step.label}
            </span>
            {step.progress && (
              <>
                <span style={{ color: '#ffaa44', fontSize: 10, marginLeft: 'auto' }}>
                  {step.progress}%
                </span>
                <div
                  style={{
                    width: 40,
                    height: 4,
                    background: '#1a2a3a',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${step.progress}%`,
                      height: '100%',
                      background: '#00aaff',
                    }}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(0,200,255,0.08)', padding: '12px 20px' }}>
        <div style={{ color: '#445566', fontSize: 10, textAlign: 'center' }}>
          OceanEmbed v1.0
          <br />
          INCOIS · SIH 2026
        </div>
      </div>
    </div>
  );
};
