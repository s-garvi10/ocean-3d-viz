import React, { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useOceanStore } from '../../store/oceanStore';
import { getColorByPalette } from '../../utils/colorUtils';

// --- ATMOSPHERE ---
const atmosphereMat: THREE.ShaderMaterialParameters = {
  vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `varying vec3 vNormal; void main() { float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0); gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.8); }`,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  transparent: true,
};

// --- STARS ---
const Stars = () => {
  const pts = useMemo(() => {
    const p = [];
    for (let i = 0; i < 4000; i++) {
      const r = 40 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      p.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    }
    return new Float32Array(p);
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={pts.length / 3} array={pts} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="white" size={0.12} transparent opacity={0.8} />
    </points>
  );
};

// --- MAIN SCENE ---
export const EarthScene = () => {
  const { gridData, lats, lons, depth, colorMin, colorMax, palette, exaggeration, selectedArgoId } = useOceanStore();
  const sliceRef = useRef<THREE.Mesh>(null);

  // 1. Earth Surface Geometry
  const earthGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(2, 96, 96);
    const pos = geo.attributes.position.array;
    const colors = new Float32Array(pos.length);
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i], y = pos[i+1], z = pos[i+2];
      const r = Math.sqrt(x*x + y*y + z*z);
      const lat = Math.asin(y / r) * (180 / Math.PI);
      const lon = Math.atan2(z, x) * (180 / Math.PI);
      let val = 35;
      if (gridData && gridData.length > 0 && lats && lats.length > 0 && lons && lons.length > 0) {
        const latIdx = Math.floor((lat + 10) / 40 * (lats.length - 1));
        const lonIdx = Math.floor((lon + 180) / 360 * (lons.length - 1));
        if (latIdx >= 0 && latIdx < gridData.length && lonIdx >= 0 && lonIdx < (gridData[0]?.length || 0)) {
          val = gridData[latIdx]?.[lonIdx] || 35;
        }
      }
      const c = getColorByPalette(val, colorMin, colorMax, palette);
      colors[i] = c.r; colors[i+1] = c.g; colors[i+2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [gridData, lats, lons, colorMin, colorMax, palette]);

  // 2. Depth Slice Prism (Extrudes dynamically)
  const sliceGeometry = useMemo(() => {
    if (!gridData || gridData.length === 0 || depth === 0 || !gridData[0] || gridData[0].length === 0) return null;
    const rows = gridData.length, cols = gridData[0].length;
    const positions = [], colors = [], indices = [];
    const radius = 2.0;
    const scale = 0.02 * exaggeration;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const lat = -10 + (j / rows) * 40;
        const lon = 50 + (i / cols) * 50;
        const phi = (90 - lat) * Math.PI / 180;
        const theta = lon * Math.PI / 180;
        const val = gridData[j]?.[i] || 35;
        const r = radius + (val - colorMin) * scale;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);
        positions.push(x, y, z);
        const c = getColorByPalette(val, colorMin, colorMax, palette);
        colors.push(c.r, c.g, c.b);
      }
    }
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = j * cols + i, b = j * cols + i + 1, c = (j+1) * cols + i, d = (j+1) * cols + i + 1;
        indices.push(a, b, c); indices.push(b, d, c);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [gridData, depth, colorMin, colorMax, palette, exaggeration]);

  // Argo positions (matches backend)
  const argoFloats = [
    { id: 'ARGO-1', lat: 15, lon: 85 },
    { id: 'ARGO-2', lat: 12, lon: 82 },
    { id: 'ARGO-3', lat: 18, lon: 88 },
    { id: 'ARGO-4', lat: 22, lon: 85 },
  ];

  return (
    <div style={{ width: '100%', height: '100vh', background: '#05080f' }}>
      <Canvas camera={{ position: [3, 1.5, 5], fov: 40 }}>
        <Stars />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-5, -2, -5]} intensity={0.3} />
        <OrbitControls enableDamping dampingFactor={0.05} minDistance={2.5} maxDistance={12} />
        
        {/* Earth */}
        <mesh geometry={earthGeometry}>
          <meshPhongMaterial vertexColors shininess={5} specular={new THREE.Color(0x222244)} />
        </mesh>
        
        {/* Atmosphere */}
        <Sphere args={[2.15, 64, 64]}>
          <shaderMaterial attach="material" args={[atmosphereMat]} />
        </Sphere>

        {/* 3D Slice Prism */}
        {sliceGeometry && (
          <mesh ref={sliceRef} geometry={sliceGeometry}>
            <meshPhongMaterial vertexColors transparent opacity={0.85} side={THREE.DoubleSide} shininess={40} emissive={new THREE.Color(0x112233)} emissiveIntensity={0.1} />
          </mesh>
        )}

        {/* Argo Markers */}
        {argoFloats.map((f) => {
          const phi = (90 - f.lat) * Math.PI / 180;
          const theta = f.lon * Math.PI / 180;
          const r = 2.05;
          const pos = [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
          const isSelected = selectedArgoId === f.id;
          return (
            <group
              key={f.id}
              position={pos as any}
              onClick={(e) => {
                e.stopPropagation();
                useOceanStore.getState().selectArgo(f.id);
              }}
            >
              <mesh>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshBasicMaterial color={isSelected ? '#ffaa00' : '#00ddff'} />
              </mesh>
              {isSelected && (
                <mesh>
                  <sphereGeometry args={[0.12, 16, 16]} />
                  <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} />
                </mesh>
              )}
              <Html position={[0, 0.15, 0]} zIndexRange={[5, 0]} center>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    useOceanStore.getState().selectArgo(f.id);
                  }}
                  style={{
                    color: isSelected ? '#ffaa00' : '#88ddff',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    border: isSelected ? '1px solid #ffaa00' : 'none',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.id}
                </div>
              </Html>
            </group>
          );
        })}
      </Canvas>
    </div>
  );
};
