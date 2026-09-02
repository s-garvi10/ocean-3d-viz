import React, { useEffect, useState } from 'react';
import { fetchMetrics } from '../../api/oceanApi';

export const MetricsCards = () => {
  const [metrics, setMetrics] = useState({ sst: 28.4, ssh_anomaly: 8.12, wind: 6.8, embedding: '256 x 4' });

  useEffect(() => {
    fetchMetrics(17.25, 88.5, '27 Aug 2026 12:00 UTC').then(setMetrics).catch(() => {});
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      display: 'flex',
      gap: 20,
      background: 'rgba(8, 12, 25, 0.6)',
      backdropFilter: 'blur(12px)',
      padding: '8px 24px',
      borderRadius: 40,
      border: '1px solid rgba(0, 200, 255, 0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, color: '#445566', textTransform: 'uppercase', letterSpacing: 1 }}>SST</div>
        <div style={{ fontSize: 18, color: '#00ffaa', fontWeight: 'bold' }}>{metrics.sst}°C</div>
      </div>
      <div style={{ width: 1, background: '#1a2a3a' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, color: '#445566', textTransform: 'uppercase', letterSpacing: 1 }}>SSH Anomaly</div>
        <div style={{ fontSize: 18, color: '#ffaa44', fontWeight: 'bold' }}>+{metrics.ssh_anomaly} m</div>
      </div>
      <div style={{ width: 1, background: '#1a2a3a' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, color: '#445566', textTransform: 'uppercase', letterSpacing: 1 }}>Surface Wind</div>
        <div style={{ fontSize: 18, color: '#44ccff', fontWeight: 'bold' }}>{metrics.wind} m/s</div>
      </div>
      <div style={{ width: 1, background: '#1a2a3a' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, color: '#445566', textTransform: 'uppercase', letterSpacing: 1 }}>Embedding Zip</div>
        <div style={{ fontSize: 18, color: '#ff66aa', fontWeight: 'bold' }}>{metrics.embedding}</div>
      </div>
    </div>
  );
};
