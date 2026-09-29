import React, { useEffect, useRef, useState } from 'react';
import { Activity, MapPin, Pin, Thermometer, X } from 'lucide-react';
import { useOceanStore } from '../../store/oceanStore';
import { fetchArgoProfile, fetchComparison, fetchThermocline } from '../../api/oceanApi';
import ProfileChart from './ProfileChart';

export const ValidationPanel = () => {
  const {
    selectedArgoId, hoveredArgoId, isHoveringPanel, argoFloats, comparison,
    thermocline, selectedProfile, setComparison, setThermocline, setProfile,
    selectArgo, setHoveredArgo, setIsHoveringPanel, variable, time,
  } = useOceanStore();
  const activeArgoId = hoveredArgoId || selectedArgoId;
  const [pinnedFloatId, setPinnedFloatId] = useState<string | null>(null);
  const cacheRef = useRef<Record<string, { profile: any; comparison: any; thermocline: any }>>({});

  useEffect(() => {
    if (activeArgoId) setPinnedFloatId(activeArgoId);
  }, [activeArgoId]);

  const displayFloatId = activeArgoId || (isHoveringPanel ? pinnedFloatId : null);

  useEffect(() => {
    if (!displayFloatId) {
      setComparison(null);
      setThermocline(null);
      setProfile(null);
      return;
    }

    const cacheKey = `${displayFloatId}_${variable}_${time}`;
    const cached = cacheRef.current[cacheKey];
    if (cached) {
      setProfile(cached.profile);
      setComparison(cached.comparison);
      setThermocline(cached.thermocline);
      return;
    }

    let isCurrent = true;
    Promise.all([
      fetchArgoProfile(displayFloatId),
      fetchComparison(displayFloatId, variable, time),
      fetchThermocline(displayFloatId, variable, time),
    ]).then(([profile, comp, tc]) => {
      if (!isCurrent) return;
      cacheRef.current[cacheKey] = { profile, comparison: comp, thermocline: tc };
      setProfile(profile);
      setComparison(comp);
      setThermocline(tc);
    }).catch(() => {
      if (isCurrent) setComparison({ rmse: null, bias: null, correlation: null, mae: null, matchedPoints: 0, error: 'Comparison failed' });
    });

    return () => { isCurrent = false; };
  }, [displayFloatId, variable, time, setComparison, setProfile, setThermocline]);

  if (!displayFloatId) return <div className="validation-panel-empty" />;

  const float = argoFloats.find((item: any) => item.id === displayFloatId);
  const isPinned = selectedArgoId === displayFloatId;
  const closePanel = () => {
    selectArgo(null);
    setHoveredArgo(null);
    setIsHoveringPanel(false);
  };

  return (
    <aside
      className="validation-panel"
      onMouseEnter={() => setIsHoveringPanel(true)}
      onMouseLeave={() => { setIsHoveringPanel(false); setHoveredArgo(null); }}
      aria-label={`ARGO ${displayFloatId} inspector`}
    >
      <header className="inspector-header">
        <div>
          <span className="eyebrow"><Activity size={13} /> ARGO FLOAT</span>
          <div className="inspector-title-row">
            <h2>{displayFloatId}</h2>
            <span className={`pin-status${isPinned ? ' pinned' : ''}`}>{isPinned ? 'PINNED' : 'PREVIEW'}</span>
          </div>
        </div>
        <button type="button" className="icon-button" onClick={closePanel} aria-label="Close ARGO inspector" title="Close inspector"><X size={16} /></button>
      </header>

      <section className="inspector-section location-section">
        <div className="section-heading"><MapPin size={14} /><span>LOCATION</span></div>
        <div className="location-grid">
          <span>Latitude</span><strong>{float ? `${float.lat.toFixed(3)}° N` : '—'}</strong>
          <span>Longitude</span><strong>{float ? `${float.lon.toFixed(3)}° E` : '—'}</strong>
          <span>Timestamp</span><strong>{time}</strong>
        </div>
      </section>

      {selectedProfile && (
        <section className="inspector-section profile-section">
          <div className="section-heading"><Thermometer size={14} /><span>PROFILE</span></div>
          <ProfileChart profile={selectedProfile} variable={variable} />
        </section>
      )}

      <section className="inspector-section">
        <div className="section-heading"><span>MODEL VALIDATION</span><span className="section-meta">VS ARGO</span></div>
        {comparison?.error ? (
          <div className="validation-error">{comparison.error}</div>
        ) : comparison ? (
          <div className="metric-grid">
            <Metric label="RMSE" value={comparison.rmse !== null ? `${comparison.rmse.toFixed(2)} °C` : 'N/A'} tone="success" />
            <Metric label="MAE" value={comparison.mae !== null ? `${comparison.mae.toFixed(2)} °C` : 'N/A'} tone="cyan" />
            <Metric label="BIAS" value={comparison.bias !== null ? `${comparison.bias.toFixed(2)} °C` : 'N/A'} tone="warning" />
            <Metric label="CORRELATION" value={comparison.correlation !== null ? comparison.correlation.toFixed(2) : 'N/A'} tone="blue" />
          </div>
        ) : <div className="panel-placeholder">Calculating validation metrics...</div>}
      </section>

      {thermocline && (
        <section className="thermocline-card">
          <div className="section-heading"><Thermometer size={14} /><span>THERMOCLINE</span></div>
          <div className="thermocline-values">
            <div><span>DEPTH</span><strong>{thermocline.depth}m</strong></div>
            <div><span>GRADIENT</span><strong>{thermocline.gradient.toFixed(2)} °C/m</strong></div>
          </div>
        </section>
      )}
    </aside>
  );
};

const Metric = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className={`metric-card ${tone}`}><span>{label}</span><strong>{value}</strong></div>
);
