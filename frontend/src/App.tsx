import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useOceanStore } from './store/oceanStore';
import { EarthScene } from './components/3D/EarthScene';
import { Sidebar } from './components/Layout/Sidebar';
import { BottomBar } from './components/Layout/BottomBar';
import { fetchSlice, fetchArgoFloats } from './api/oceanApi';

const ValidationPanel = lazy(() => import('./components/UI/ValidationPanel').then(({ ValidationPanel }) => ({ default: ValidationPanel })));
const MiniMap = lazy(() => import('./components/Map/MiniMap').then(({ MiniMap }) => ({ default: MiniMap })));
const MetricsCards = lazy(() => import('./components/UI/MetricsCards').then(({ MetricsCards }) => ({ default: MetricsCards })));
const LearnModal = lazy(() => import('./components/UI/LearnModal').then(({ LearnModal }) => ({ default: LearnModal })));
const WorkspacePanel = lazy(() => import('./components/UI/WorkspacePanel').then(({ WorkspacePanel }) => ({ default: WorkspacePanel })));

function App() {
  const {
    variable, depth, time, region, setGridData, setArgoFloats,
    setLoading, setError, isLoading, error, isPlaying, setTime,
    displayMode, setDisplayMode, hoveredArgoId, selectedArgoId, isHoveringPanel,
    setDataSource, dataSource
  } = useOceanStore();

  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const timesteps = ['28 Aug 2026', '29 Aug 2026', '30 Aug 2026'];
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPanelVisible = Boolean(hoveredArgoId || selectedArgoId || isHoveringPanel);

  // --- Fetch Argo floats ---
  useEffect(() => {
    fetchArgoFloats(region, time).then(setArgoFloats).catch(() => {});
  }, [region, time]);

  // --- Fetch ocean slice ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const bbox = region === 'North Indian Ocean' ? '50,-10,100,30' : '65,5,90,25';
        const res = await fetchSlice({ variable, depth, time, bbox });
        if (res.data && res.data.length > 0) {
          setGridData(res.data, res.lats, res.lons);
          setDataSource(res.source === 'demo' ? 'demo' : 'live');
        } else {
          throw new Error('No data returned');
        }
      } catch (err: any) {
        setError(err.message || 'Live API unavailable');
        setDataSource('demo');
        const rows = 40, cols = 50;
        const mock = Array.from({ length: rows }, (_, j) =>
          Array.from({ length: cols }, (_, i) => {
            const dist = Math.sqrt(Math.pow(j - 20, 2) + Math.pow(i - 25, 2));
            return 28 - (depth / 200) + 4 * Math.exp(-dist * dist / 200);
          })
        );
        const mlats = Array.from({ length: rows }, (_, i) => -10 + (i / (rows - 1)) * 40);
        const mlons = Array.from({ length: cols }, (_, i) => 50 + (i / (cols - 1)) * 50);
        setGridData(mock, mlats, mlons);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [variable, depth, time, region]);

  // --- Animation loop ---
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setInterval(() => {
        const idx = timesteps.indexOf(time);
        setTime(timesteps[(idx + 1) % timesteps.length]);
      }, 2000);
    } else {
      if (animationRef.current) clearInterval(animationRef.current);
    }
    return () => { if (animationRef.current) clearInterval(animationRef.current); };
  }, [isPlaying, time]);

  return (
    <div className={`app-shell${isPanelVisible ? ' inspector-open' : ''}`}>
      <Sidebar />
      <div style={{ gridArea: 'main', position: 'relative' }}>
        <EarthScene />
        <Suspense fallback={null}>
          <MetricsCards />
          <MiniMap />
        </Suspense>

        <div className={`data-status ${dataSource === 'live' ? 'is-live' : 'is-demo'}`} role="status">
          <span aria-hidden="true">{dataSource === 'live' ? '●' : '◐'}</span>
          {dataSource === 'live' ? 'LIVE DATA' : 'DEMO DATA'}
        </div>

        {/* Depth Strip Overlay */}
        <div className="depth-legend" aria-label="Depth color scale from 0 to 800 metres">
          <span>DEPTH</span>
          {[0, 200, 400, 600, 800].map((value) => <span key={value}>{value}m</span>)}
        </div>

        {isLoading && (
          <div className="loading-card" role="status">
            <span className="loading-dot" aria-hidden="true" />
            <div>
              <strong>Updating ocean model</strong>
              <span>{variable} · {depth}m · {region}</span>
            </div>
          </div>
        )}
        {error && (
          <div className="demo-notice" role="status">
            <strong>Demo data</strong>
            <span>{error}. Showing synthetic ocean data.</span>
          </div>
        )}
        <Suspense fallback={null}>
          <WorkspacePanel />
        </Suspense>
      </div>
      {isPanelVisible && (
        <Suspense fallback={<div className="inspector-loading">Loading inspector...</div>}>
          <ValidationPanel />
        </Suspense>
      )}
      <BottomBar />

      <Suspense fallback={null}>
        <LearnModal
          isOpen={displayMode === 'outreach' || isLearnOpen}
          onClose={() => {
            setIsLearnOpen(false);
            setDisplayMode('3dglobe');
          }}
        />
      </Suspense>
    </div>
  );
}

export default App;
