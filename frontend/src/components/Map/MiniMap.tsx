import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useOceanStore } from '../../store/oceanStore';

export const MiniMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { region, depth, time, variable } = useOceanStore();

  useEffect(() => {
    if (!mapContainer.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [80, 15],
      zoom: 4,
      interactive: false,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      right: 20,
      zIndex: 10,
      width: 200,
      height: 150,
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid rgba(0,200,255,0.12)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
    }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        bottom: 4,
        left: 8,
        right: 8,
        background: 'rgba(0,0,0,0.7)',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 9,
        color: '#8899bb',
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'monospace'
      }}>
        <span>{variable.toUpperCase()} {depth}m</span>
        <span>{time}</span>
      </div>
    </div>
  );
};
