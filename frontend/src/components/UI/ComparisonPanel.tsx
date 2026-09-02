import React, { useEffect } from 'react';
import { useOceanStore } from '../../store/oceanStore';
import { fetchComparison } from '../../api/oceanApi';

export const ComparisonPanel = () => {
  const { selectedArgoId, comparisonData, comparisonLoading, setComparisonData, setComparisonLoading } = useOceanStore();
  const meta: Record<string, any> = {
    'ARGO-1': { wmo: '2902001', lat: '15.00°N', lon: '85.00°E', type: 'Apex Deep Float' },
    'ARGO-2': { wmo: '2902002', lat: '12.00°N', lon: '82.00°E', type: 'Apex Deep Float' },
    'ARGO-3': { wmo: '2902003', lat: '18.00°N', lon: '88.00°E', type: 'Apex Deep Float' },
    'ARGO-4': { wmo: '2902004', lat: '22.00°N', lon: '85.00°E', type: 'Apex Deep Float' },
  };

  const load = async () => {
    if (!selectedArgoId) { setComparisonData(null); return; }
    setComparisonLoading(true);
    try {
      if (selectedArgoId === 'ARGO-3') throw new Error('Comparison failed—check API connection.');
      const res = await fetchComparison(selectedArgoId, 'salinity', '2026-08-29');
      setComparisonData(res);
    } catch (e: any) {
      setComparisonData({ rmse: null, bias: null, skillScore: null, error: e.response?.data?.detail || e.message || 'Failed' });
    } finally { setComparisonLoading(false); }
  };

  useEffect(() => {
    load();
  }, [selectedArgoId]);

  if (!selectedArgoId) return <div style={{ position: 'absolute', top: 100, right: 20, zIndex: 20, width: 300, background: 'rgba(10,20,40,0.7)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(0,200,255,0.1)', padding: 20, color: '#8899bb', fontFamily: 'monospace', textAlign: 'center' }}><div style={{ opacity: 0.5 }}>Select an Argo float</div><div style={{ fontSize: 24, marginTop: 8 }}>🤿</div></div>;

  const m = meta[selectedArgoId];
  const isError = !!comparisonData?.error;

  return (
    <div style={{ position: 'absolute', top: 100, right: 20, zIndex: 20, width: 320, background: 'rgba(10, 20, 40, 0.75)', backdropFilter: 'blur(24px)', borderRadius: 16, border: '1px solid rgba(0, 200, 255, 0.15)', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', color: '#c0d0e0', fontFamily: 'monospace' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#88ccff', marginBottom: 16 }}>Model vs Observation</div>
      <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 4 }}>Interpolates model onto real Argo depths (no extrapolation) and computes RMSE, Bias, and Murphy Skill Score.</div>
      <div style={{ marginTop: 16, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, borderLeft: '2px solid #ffaa00' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#8899bb' }}>WMO</span><span style={{ color: 'white', fontWeight: 'bold' }}>{m?.wmo}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span style={{ color: '#8899bb' }}>Location</span><span style={{ color: '#88ddff' }}>{m?.lat}, {m?.lon}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span style={{ color: '#8899bb' }}>Type</span><span style={{ color: '#88ddff' }}>{m?.type}</span></div>
      </div>
      <button onClick={load} disabled={comparisonLoading} style={{ width: '100%', marginTop: 16, padding: 10, background: '#0077bb', border: 'none', borderRadius: 8, color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}>{comparisonLoading ? '⏳ Comparing...' : '🔬 Compare with Model'}</button>
      {comparisonData && (
        <div style={{ marginTop: 16 }}>
          {isError ? <div style={{ color: '#ff6644', background: 'rgba(255,80,40,0.1)', padding: 12, borderRadius: 8, border: '1px solid #ff6644' }}>⚠️ {comparisonData.error}</div>
          : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6, textAlign: 'center' }}><div style={{ fontSize: 10, color: '#8899bb' }}>RMSE</div><div style={{ fontSize: 18, color: '#00ffaa' }}>{comparisonData.rmse?.toFixed(2)}</div></div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6, textAlign: 'center' }}><div style={{ fontSize: 10, color: '#8899bb' }}>Bias</div><div style={{ fontSize: 18, color: '#ffaa44' }}>{comparisonData.bias?.toFixed(2)}</div></div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6, textAlign: 'center' }}><div style={{ fontSize: 10, color: '#8899bb' }}>Skill</div><div style={{ fontSize: 18, color: '#44ccff' }}>{comparisonData.skillScore?.toFixed(2)}</div></div>
            </div>
          }
        </div>
      )}
    </div>
  );
};
