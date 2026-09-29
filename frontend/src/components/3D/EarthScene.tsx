import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useOceanStore } from '../../store/oceanStore';
import { getColorByPalette } from '../../utils/colorUtils';

// --- Atmosphere Shader ---
const atmosphereMat = {
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
      gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.8);
    }
  `,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  transparent: true,
};

// --- Stars ---
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
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
      </bufferGeometry>
      <pointsMaterial color="white" size={0.12} transparent opacity={0.8} />
    </points>
  );
};

// --- Inner Scene Component (rendered inside Canvas context) ---
const SceneContent = () => {
  const {
    gridData, lats, lons, variable, depth, colorMin, colorMax, palette,
    exaggeration, opacity, displayMode, showModel, showArgo, showCurrents,
    showThermocline, showGrid, selectedArgoId, hoveredArgoId, argoFloats, isPlaying, setDepth,
  } = useOceanStore();

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const handlePointerOver = (id: string) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    useOceanStore.getState().setHoveredArgo(id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      useOceanStore.getState().setHoveredArgo(null);
    }, 400);
  };

  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [isFlying, setIsFlying] = useState(false);

  // --- Load Earth textures ---
  const [earthMap, earthSpecular, cloudsMap] = useLoader(THREE.TextureLoader, [
    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
  ]);

  // --- Earth geometry ---
  const earthGeometry = useMemo(() => new THREE.SphereGeometry(2, 64, 64), []);

  // --- Depth Curtain Geometry ---
  const curtainGeometry = useMemo(() => {
    if (!gridData || gridData.length === 0 || !showModel) return null;
    const rows = gridData.length;
    const cols = gridData[0].length;
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const radius = 2.0;
    const scale = 0.03 * exaggeration;

    const latitudeValues = lats.length === rows
      ? lats
      : Array.from({ length: rows }, (_, index) => -10 + (index / Math.max(rows - 1, 1)) * 40);
    const longitudeValues = lons.length === cols
      ? lons
      : Array.from({ length: cols }, (_, index) => 50 + (index / Math.max(cols - 1, 1)) * 50);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const lat = latitudeValues[j];
        const lon = longitudeValues[i];
        const phi = (90 - lat) * Math.PI / 180;
        const theta = lon * Math.PI / 180;
        const val = gridData[j]?.[i] ?? 20;
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
        const a = j * cols + i;
        const b = j * cols + i + 1;
        const c = (j + 1) * cols + i;
        const d = (j + 1) * cols + i + 1;
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [gridData, colorMin, colorMax, palette, exaggeration, showModel]);

  // --- Fly to Argo ---
  useEffect(() => {
    if (!selectedArgoId) {
      setIsFlying(false);
      targetRef.current.set(0, 0, 0);
      return;
    }
    const float = argoFloats.find((f: any) => f.id === selectedArgoId);
    if (!float) return;
    const phi = (90 - float.lat) * Math.PI / 180;
    const theta = float.lon * Math.PI / 180;
    const pos = new THREE.Vector3(
      2.8 * Math.sin(phi) * Math.cos(theta),
      2.8 * Math.cos(phi),
      2.8 * Math.sin(phi) * Math.sin(theta)
    );
    targetRef.current.copy(pos);
    setIsFlying(true);
  }, [selectedArgoId, argoFloats]);

  // --- Animation Loop ---
  useFrame(() => {
    if (isFlying && targetRef.current.length() > 0) {
      const dist = camera.position.distanceTo(targetRef.current);
      if (dist < 0.05) {
        setIsFlying(false);
      } else {
        camera.position.lerp(targetRef.current, 0.03);
        camera.lookAt(0, 0, 0);
      }
    }
    if (isPlaying) {
      const newDepth = Math.sin(Date.now() / 2000) * 100 + 225;
      setDepth(Math.round(Math.max(0, Math.min(500, newDepth))));
    }
  });

  return (
    <>
      <Stars />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-5, -2, -5]} intensity={0.3} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2.5}
        maxDistance={12}
        onStart={() => {
          if (isFlying) setIsFlying(false);
        }}
      />

      {/* Earth */}
      <mesh geometry={earthGeometry}>
        <meshPhongMaterial
          map={earthMap}
          specularMap={earthSpecular}
          specular={new THREE.Color(0x333333)}
          shininess={10}
        />
      </mesh>

      {/* Clouds */}
      <Sphere args={[2.12, 64, 64]}>
        <meshPhongMaterial map={cloudsMap} transparent opacity={0.25} depthWrite={false} />
      </Sphere>

      {/* Atmosphere */}
      <Sphere args={[2.15, 64, 64]}>
        <shaderMaterial attach="material" args={[atmosphereMat]} />
      </Sphere>

      {/* Depth Curtain */}
      {curtainGeometry && (displayMode === 'depthcurtain' || displayMode === 'live' || displayMode === '3dglobe') && (
        <mesh geometry={curtainGeometry}>
          <meshPhongMaterial
            vertexColors
            transparent
            opacity={opacity}
            side={THREE.DoubleSide}
            shininess={40}
            emissive={new THREE.Color(0x112233)}
            emissiveIntensity={0.1}
          />
        </mesh>
      )}

      {/* Argo Floats */}
      {showArgo &&
        argoFloats.map((f: any) => {
          const phi = (90 - f.lat) * Math.PI / 180;
          const theta = f.lon * Math.PI / 180;
          const r = 2.05;
          const pos: [number, number, number] = [
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
          ];
          const isSelected = selectedArgoId === f.id;
          const isHovered = hoveredArgoId === f.id;
          const isHighlighted = isSelected || isHovered;

          return (
            <group
              key={f.id}
              position={pos}
              onPointerOver={(e) => {
                e.stopPropagation();
                handlePointerOver(f.id);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                handlePointerOut();
              }}
              onClick={(e) => {
                e.stopPropagation();
                useOceanStore.getState().selectArgo(isSelected ? null : f.id);
              }}
            >
              {/* Invisible larger hover hit target */}
              <mesh>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>

              {/* Core float sphere */}
              <mesh>
                <sphereGeometry args={[isHighlighted ? 0.085 : 0.06, 16, 16]} />
                <meshBasicMaterial color={isHighlighted ? '#ffaa00' : '#00ddff'} />
              </mesh>

              {/* Glowing aura when hovered or selected */}
              {isHighlighted && (
                <mesh>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshBasicMaterial color="#ffaa00" transparent opacity={0.35} />
                </mesh>
              )}

              {/* Float ID Label */}
              <Html position={[0, 0.18, 0]} center>
                <div
                  onMouseEnter={() => handlePointerOver(f.id)}
                  onMouseLeave={handlePointerOut}
                  onClick={(e) => {
                    e.stopPropagation();
                    useOceanStore.getState().selectArgo(isSelected ? null : f.id);
                  }}
                  style={{
                    color: isHighlighted ? '#ffaa00' : '#88ddff',
                    fontSize: 9,
                    fontWeight: isHighlighted ? 'bold' : 'normal',
                    fontFamily: 'monospace',
                    background: isHighlighted ? 'rgba(25, 20, 5, 0.9)' : 'rgba(0,0,0,0.7)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    border: isHighlighted ? '1px solid #ffaa00' : '1px solid rgba(0, 200, 255, 0.2)',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    boxShadow: isHighlighted ? '0 0 10px rgba(255, 170, 0, 0.5)' : 'none',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.id}
                </div>
              </Html>
            </group>
          );
        })}

      {/* Thermocline Ring */}
      {showThermocline && (
        <mesh position={[0, 0.3, 0]}>
          <ringGeometry args={[2.2, 2.3, 64]} />
          <meshBasicMaterial color="#ff6644" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Grid */}
      {showGrid && <gridHelper args={[5, 10, '#00aaff', '#334466']} />}
    </>
  );
};

export const EarthScene = () => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#05080f', position: 'relative' }}>
      <Canvas
        camera={{ position: [3, 1.5, 5], fov: 40 }}
        onPointerMissed={() => {
          useOceanStore.getState().selectArgo(null);
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
};

