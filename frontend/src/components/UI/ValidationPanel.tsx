import React, { useEffect } from 'react';
import { useOceanStore } from '../../store/oceanStore';
import { fetchArgoProfile, fetchComparison, fetchThermocline } from '../../api/oceanApi';
import ProfileChart from './ProfileChart';

export const ValidationPanel = () => {
  const {
    selectedArgoId, argoFloats, comparison, thermocline, selectedProfile,
    setComparison, setThermocline, setProfile, variable, time
  } = useOceanStore();

  useEffect(() => {
    if (!selectedArgoId) {
      setComparison(null);
      setThermocline(null);
      setProfile(null);
      return;
    }

    const loadData = async () => {
      try {
        const profile = await fetchArgoProfile(selectedArgoId);
        setProfile(profile);
        const comp = await fetchComparison(selectedArgoId, variable, time);
        setComparison(comp);
        const tc = await fetchThermocline(selectedArgoId, variable, time);
        setThermocline(tc);
      } catch (e) {
        setComparison({ rmse: null, bias: null, correlation: null, mae: null, matchedPoints: 0, error: 'Comparison failed' });
      }
    };
    loadData();
  }, [selectedArgoId, variable, time]);

  const float = argoFloats.find((f: any) => f.id === selectedArgoId);
  const isError = comparison?.error;

  if (!selectedArgoId) {
    return (
      <div style={{
        gridArea: 'rightpanel',
        background: 'rgba(8, 12, 25, 0.95)',
        backdropFilter: 'blur(10px)',
        borderLeft: '1px solid rgba(0, 200, 255, 0.08)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#445566',
        fontFamily: 'monospace'
      }}>
        <div style={{ fontSize: 40, opacity: 0.3 }}>??</div>
        <div style={{ marginTop: 12, fontSize: 12 }}>SELECT AN ARGO FLOAT</div>
        <div style={{ fontSize: 10, color: '#334466', marginTop: 4 }}>Click any Argo marker on the globe</div>
      </div>
    );
  }

  return (
    <div style={{
      gridArea: 'rightpanel',
      background: 'rgba(8, 12, 25, 0.95)',
      backdropFilter: 'blur(10px)',
      borderLeft: '1px solid rgba(0, 200, 255, 0.08)',
      padding: '16px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      {/* Location Info */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, borderLeft: '2px solid #00aaff' }}>
        <div style={{ color: '#88ccff', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          TEMPERATURE AT LOCATION
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: 12 }}>
          <span style={{ color: '#8899bb' }}>Lat</span><span style={{ color: 'white' }}>{float?.lat}° N</span>
          <span style={{ color: '#8899bb' }}>Lon</span><span style={{ color: 'white' }}>{float?.lon}° E</span>
          <span style={{ color: '#8899bb' }}>Date</span><span style={{ color: 'white', fontSize: 11 }}>{time}</span>
        </div>
      </div>

      {/* Profile Chart */}
      {selectedProfile && <ProfileChart profile={selectedProfile} variable={variable} />}

      {/* Validation Metrics */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12 }}>
        <div style={{ color: '#88ccff', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          VALIDATION METRICS (vs ARGO)
        </div>
        {isError ? (
          <div style={{ color: '#ff6644', fontSize: 12 }}>?? {comparison?.error}</div>
        ) : comparison ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <div>
              <span style={{ color: '#8899bb', fontSize: 9 }}>RMSE</span>
              <div style={{ color: '#00ffaa', fontSize: 18, fontWeight: 'bold' }}>{comparison.rmse?.toFixed(2)} °C</div>
            </div>
            <div>
              <span style={{ color: '#8899bb', fontSize: 9 }}>Correlation</span>
              <div style={{ color: '#44ccff', fontSize: 18, fontWeight: 'bold' }}>{comparison.correlation?.toFixed(2)}</div>
            </div>
            <div>
              <span style={{ color: '#8899bb', fontSize: 9 }}>MAE</span>
              <div style={{ color: '#ffaa44', fontSize: 16 }}>{comparison.mae?.toFixed(2)} °C</div>
            </div>
            <div>
              <span style={{ color: '#8899bb', fontSize: 9 }}>Bias</span>
              <div style={{ color: '#ff6644', fontSize: 16 }}>{comparison.bias?.toFixed(2)} °C</div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#445566', fontSize: 12 }}>Calculating...</div>
        )}
      </div>

      {/* Thermocline */}
      {thermocline && (
        <div style={{ background: 'rgba(255,100,50,0.08)', border: '1px solid rgba(255,100,50,0.3)', borderRadius: 8, padding: 10 }}>
          <span style={{ color: '#ffaa44', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>??? Thermocline</span>
          <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
            <div>
              <span style={{ color: '#8899bb', fontSize: 10 }}>Depth</span>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{thermocline.depth}m</div>
            </div>
            <div>
              <span style={{ color: '#8899bb', fontSize: 10 }}>Gradient</span>
              <div style={{ color: '#ff6644', fontSize: 14 }}>{thermocline.gradient.toFixed(2)} °C/m</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
