import React from 'react';
import { useOceanStore } from '../../store/oceanStore';

export const TopBar = () => {
  const { togglePanel, setLearn, showPanel, showLearn } = useOceanStore();
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, rgba(5,8,15,0.9) 0%, transparent 100%)', pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, pointerEvents: 'auto' }}>
        <span style={{ color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 }}>OCEAN-X</span>
        <button onClick={togglePanel} style={{ background: 'transparent', border: '1px solid #334466', color: '#88ccff', padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer' }}>{showPanel ? 'Hide' : 'Show'}</button>
        <button onClick={() => setLearn(!showLearn)} style={{ background: 'transparent', border: '1px solid #334466', color: '#88ccff', padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer' }}>Learn</button>
      </div>
      <div style={{ color: '#445566', fontSize: 11, pointerEvents: 'auto' }}><span style={{ color: '#00e676' }}>●</span> SYSTEM ONLINE</div>
    </div>
  );
};
