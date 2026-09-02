import React, { useEffect, useRef, useState } from 'react';
import { useOceanStore } from './store/oceanStore';
import { EarthScene } from './components/3D/EarthScene';
import { Sidebar } from './components/Layout/Sidebar';
import { BottomBar } from './components/Layout/BottomBar';
import { ValidationPanel } from './components/UI/ValidationPanel';
import { MiniMap } from './components/Map/MiniMap';
import { MetricsCards } from './components/UI/MetricsCards';
import { LearnModal } from './components/UI/LearnModal';
import { fetchSlice, fetchArgoFloats } from './api/oceanApi';

function App() {
  const {
    variable, depth, time, region, setGridData, setArgoFloats,
    setLoading, setError, isLoading, error, isPlaying, setTime,
    displayMode, setDisplayMode
  } = useOceanStore();

  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const timesteps = ['28 Aug 2026', '29 Aug 2026', '30 Aug 2026'];
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        } else {
          throw new Error('No data returned');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load ocean data');
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
    <div style={{
      display: 'grid',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#05080f',
      gridTemplateColumns: '260px 1fr 320px',
      gridTemplateRows: '1fr 80px',
      gridTemplateAreas: '"sidebar main rightpanel" "sidebar bottom bottom"'
    }}>
      <Sidebar />
      <div style={{ gridArea: 'main', position: 'relative' }}>
        <EarthScene />
        <MetricsCards />
        <MiniMap />

        {/* Depth Strip Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          padding: '4px 20px',
          borderRadius: 20,
          border: '1px solid rgba(0,200,255,0.06)',
          pointerEvents: 'none'
        }}>
          <span style={{ color: '#445566', fontSize: 9 }}>0m</span>
          <div style={{ width: 200, height: 2, background: 'linear-gradient(to right, #00aaff, #ffaa44)' }} />
          <span style={{ color: '#445566', fontSize: 9 }}>200m</span>
          <div style={{ width: 150, height: 2, background: 'linear-gradient(to right, #ffaa44, #ff6644)' }} />
          <span style={{ color: '#445566', fontSize: 9 }}>400m</span>
          <div style={{ width: 150, height: 2, background: 'linear-gradient(to right, #ff6644, #aa44ff)' }} />
          <span style={{ color: '#445566', fontSize: 9 }}>600m</span>
          <div style={{ width: 150, height: 2, background: 'linear-gradient(to right, #aa44ff, #4400aa)' }} />
          <span style={{ color: '#445566', fontSize: 9 }}>800m</span>
        </div>

        {isLoading && (
          <div style={{
            position: 'absolute',
            bottom: 120,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            background: 'rgba(0,0,0,0.7)',
            padding: '6px 20px',
            borderRadius: 20,
            border: '1px solid #00aaff',
            color: '#88ccff',
            fontSize: 11,
            fontFamily: 'monospace'
          }}>
            ⏳ LOADING OCEAN DATA...
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            background: 'rgba(255,50,50,0.12)',
            border: '1px solid #ff6644',
            padding: '6px 20px',
            borderRadius: 8,
            color: '#ff6644',
            fontSize: 11,
            fontFamily: 'monospace'
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>
      <ValidationPanel />
      <BottomBar />

      <LearnModal
        isOpen={displayMode === 'outreach' || isLearnOpen}
        onClose={() => {
          setIsLearnOpen(false);
          setDisplayMode('3dglobe');
        }}
      />
    </div>
  );
}

export default App;
