import React, { useEffect, useRef } from 'react';
import { EarthScene } from './components/3D/EarthScene';
import { SidePanel } from './components/UI/SidePanel';
import { BottomBar } from './components/UI/BottomBar';
import { TopBar } from './components/UI/TopBar';
import { ComparisonPanel } from './components/UI/ComparisonPanel';
import { LearnModal } from './components/UI/LearnModal';
import { useOceanStore } from './store/oceanStore';
import { fetchSlice } from './api/oceanApi';

function App() {
  const { variable, depth, time, isPlaying, setTime, setGridData, showLearn } = useOceanStore();
  const animationRef = useRef<any>(null);
  const timesteps = ['2026-08-28', '2026-08-29', '2026-08-30'];

  // Fetch data when params change
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchSlice({ variable, depth, time, bbox: '50,-10,100,30' });
        if (res.data && res.data.length > 0) {
          setGridData(res.data, res.lats, res.lons);
        }
      } catch (e) {
        console.error('API error, generating mock grid');
        // Fallback mock (generates a warm eddy)
        const rows = 40, cols = 50;
        const mock = Array.from({ length: rows }, (_, j) => 
          Array.from({ length: cols }, (_, i) => {
            const dist = Math.sqrt(Math.pow(j - 20, 2) + Math.pow(i - 25, 2));
            return 35 - (dist / 30) * 5 + (depth / 200);
          })
        );
        const mlats = Array.from({ length: rows }, (_, i) => -10 + (i / (rows - 1)) * 40);
        const mlons = Array.from({ length: cols }, (_, i) => 50 + (i / (cols - 1)) * 50);
        setGridData(mock, mlats, mlons);
      }
    };
    load();
  }, [variable, depth, time]);

  // Animation Loop
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setInterval(() => {
        const idx = timesteps.indexOf(time);
        setTime(timesteps[(idx + 1) % timesteps.length]);
      }, 1500);
    } else {
      if (animationRef.current) clearInterval(animationRef.current);
    }
    return () => { if (animationRef.current) clearInterval(animationRef.current); };
  }, [isPlaying, time]);

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: '#05080f', position: 'relative' }}>
      <EarthScene />
      <TopBar />
      <SidePanel />
      <ComparisonPanel />
      <BottomBar />
      {showLearn && <LearnModal />}
    </div>
  );
}

export default App;
