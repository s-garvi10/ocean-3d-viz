import React from 'react';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleHelp,
  Database,
  FileChartColumn,
  Globe2,
  Layers3,
  Settings2,
  Waves,
  Wind,
} from 'lucide-react';
import { useOceanStore } from '../../store/oceanStore';

const menuItems = [
  { id: 'live', label: 'Live Ocean', icon: Waves, action: 'reset', group: 'Explore' },
  { id: '3dglobe', label: '3D Globe', icon: Globe2, action: 'globe', group: 'Explore' },
  { id: 'depthcurtain', label: 'Depth Curtain', icon: Layers3, action: 'curtain', group: 'Explore' },
  { id: 'profile', label: 'Temperature Profile', icon: Activity, action: 'profile', group: 'Explore' },
  { id: 'currents', label: 'Currents', icon: Wind, action: 'currents', group: 'Explore' },
  { id: 'argo', label: 'ARGO Floats', icon: Activity, action: 'argo', group: 'Observe' },
  { id: 'validation', label: 'Validation', icon: CheckCircle2, action: 'validation', group: 'Observe' },
  { id: 'ai', label: 'AI Reconstruction', icon: BrainCircuit, action: 'ai', group: 'Analyze' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, action: 'analytics', group: 'Analyze' },
  { id: 'sources', label: 'Data Sources', icon: Database, action: 'sources', group: 'Analyze' },
  { id: 'settings', label: 'Settings', icon: Settings2, action: 'settings', group: 'System' },
  { id: 'outreach', label: 'Guide', icon: CircleHelp, action: 'outreach', group: 'System' },
];

const navGroups = ['Explore', 'Observe', 'Analyze', 'System'];

export const Sidebar = () => {
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

  const handleMenuClick = (item: any) => {
    switch (item.action) {
      case 'reset':
        setDisplayMode('live');
        setVariable('temperature');
        setDepth(100);
        setTime('27 Aug 2026 12:00 UTC');
        if (!showModel) toggleLayer('showModel');
        if (!showArgo) toggleLayer('showArgo');
        break;
      case 'outreach':
        setDisplayMode('outreach');
        break;
      case 'globe':
        setDisplayMode('3dglobe');
        if (!showModel) toggleLayer('showModel');
        break;
      case 'curtain':
        setDisplayMode('depthcurtain');
        if (!showModel) toggleLayer('showModel');
        break;
      case 'profile':
        setDisplayMode('profile');
        setVariable('temperature');
        break;
      case 'currents':
        setDisplayMode('currents');
        if (!showCurrents) toggleLayer('showCurrents');
        break;
      case 'argo':
        setDisplayMode('argo');
        if (!showArgo) toggleLayer('showArgo');
        break;
      case 'ai':
        setDisplayMode('ai');
        break;
      case 'validation':
        setDisplayMode('validation');
        break;
      case 'sources':
        setDisplayMode('sources');
        break;
      case 'analytics':
        setDisplayMode('analytics');
        break;
      case 'settings':
        setDisplayMode('settings');
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
    <aside
      className="sidebar"
      style={{
        gridArea: 'sidebar',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '24px 0 16px',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '0 18px', marginBottom: 24 }}>
        <span style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>
          OCEAN-X
        </span>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>
          Ocean Intelligence
        </div>
        <div style={{ color: 'var(--success)', fontSize: 9, marginTop: 12, letterSpacing: 0.7 }}>
          <span style={{ marginRight: 6 }}>●</span>SYSTEM ONLINE
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {navGroups.map((group) => (
          <div key={group} style={{ marginBottom: 18 }}>
            <div style={{ padding: '0 18px 7px', color: 'var(--text-muted)', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {group}
            </div>
            {menuItems.filter((item) => item.group === group).map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMenuClick(item)}
                  aria-current={active ? 'page' : undefined}
                  style={{
                    width: 'calc(100% - 16px)',
                    padding: '9px 12px',
                    margin: '2px 8px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    background: active ? 'rgba(56, 200, 232, 0.12)' : 'transparent',
                    border: '1px solid transparent',
                    borderLeft: active ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'all var(--transition-fast) ease',
                  }}
                >
                  <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.action === 'argo' && <span aria-label={showArgo ? 'ARGO layer on' : 'ARGO layer off'} style={{ marginLeft: 'auto', color: showArgo ? 'var(--success)' : 'var(--text-muted)', fontSize: 10 }}>●</span>}
                  {item.action === 'currents' && <span aria-label={showCurrents ? 'Currents layer on' : 'Currents layer off'} style={{ marginLeft: 'auto', color: showCurrents ? 'var(--accent-cyan)' : 'var(--text-muted)', fontSize: 10 }}>●</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 18px' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Data Pipeline
        </div>
        {pipeline.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              style={{
                color:
                  step.status === 'completed'
                    ? 'var(--success)'
                    : step.status === 'inprogress'
                    ? 'var(--accent-cyan)'
                    : 'var(--text-muted)',
                fontSize: 12,
              }}
            >
              {step.status === 'completed' ? '✓' : step.status === 'inprogress' ? '⏳' : '○'}
            </span>
            <span style={{ color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: 11 }}>
              {step.label}
            </span>
            {step.progress && (
              <>
                <span style={{ color: '#ffaa44', fontSize: 10, marginLeft: 'auto' }}>
                  {step.progress}%
                </span>
                <div style={{ width: 40, height: 4, background: '#1a2a3a', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${step.progress}%`, height: '100%', background: 'var(--accent-cyan)' }} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 18px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'center' }}>
          OceanEmbed v1.0
        </div>
      </div>
    </aside>
  );
};
