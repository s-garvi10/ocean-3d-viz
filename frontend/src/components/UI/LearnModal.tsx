import React from 'react';
import { useOceanStore } from '../../store/oceanStore';

export const LearnModal = () => {
  const { setLearn } = useOceanStore();
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(10,20,40,0.95)', padding: 40, borderRadius: 24, maxWidth: 600, border: '1px solid #00aaff', color: '#c0d0e0', fontFamily: 'monospace' }}>
        <h2 style={{ color: '#88ccff' }}>🌊 Understanding the Thermocline</h2>
        <p>The thermocline is the rapid transition layer between warm surface water and cold deep water.</p>
        <p style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, marginTop: 12 }}>🔬 <strong>Detected at ~84m</strong> in the Bay of Bengal.</p>
        <p style={{ fontSize: 12, color: '#8899bb', marginTop: 12 }}>This layer is critical for marine life, climate regulation, and naval operations.</p>
        <button onClick={() => setLearn(false)} style={{ marginTop: 20, background: '#0077bb', border: 'none', padding: '10px 30px', borderRadius: 40, color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Explore More</button>
      </div>
    </div>
  );
};
