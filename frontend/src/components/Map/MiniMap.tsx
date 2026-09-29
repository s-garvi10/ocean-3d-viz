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
    <div className="mini-map-card">
      <div ref={mapContainer} className="mini-map-canvas" />
      <div className="mini-map-caption">
        <span><strong>REGION</strong>{region}</span>
        <span><strong>{variable.toUpperCase()} · {depth}m</strong>{time}</span>
      </div>
    </div>
  );
};
