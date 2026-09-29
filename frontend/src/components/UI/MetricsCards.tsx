import React, { useEffect, useState } from 'react';
import { fetchMetrics } from '../../api/oceanApi';

export const MetricsCards = () => {
  const [metrics, setMetrics] = useState({ sst: 28.4, ssh_anomaly: 8.12, wind: 6.8, embedding: '256 x 4' });

  useEffect(() => {
    fetchMetrics(17.25, 88.5, '27 Aug 2026 12:00 UTC').then(setMetrics).catch(() => {});
  }, []);

  return (
    <div className="metrics-strip" aria-label="Surface ocean metrics">
      <Metric label="SST" value={`${metrics.sst} °C`} tone="success" />
      <Metric label="SSH ANOMALY" value={`+${metrics.ssh_anomaly} cm`} tone="warning" />
      <Metric label="SURFACE WIND" value={`${metrics.wind} m/s`} tone="cyan" />
      <Metric label="EMBEDDING" value={metrics.embedding} tone="pink" />
    </div>
  );
};

const Metric = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className={`surface-metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>
);
