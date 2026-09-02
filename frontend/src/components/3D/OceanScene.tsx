import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OceanSlice } from './OceanSlice';

interface OceanSceneProps {
  gridData: number[][] | null;
  lats: number[];
  lons: number[];
  colorMin: number;
  colorMax: number;
  palette?: string;
  selectedDepth: number;              // metres — determines Y position of the plane
  exaggeration: number;               // vertical exaggeration for the depth axis
  thermoclineDepth?: number | null;   // metres — position of thermocline plane
  showThermocline?: boolean;
  showCurrents?: boolean;
  currentU?: number[][] | null;       // real U velocity field (m/s)
  currentV?: number[][] | null;       // real V velocity field (m/s)
}

export function OceanScene({
  gridData,
  lats,
  lons,
  colorMin,
  colorMax,
  palette = 'thermal',
  selectedDepth,
  exaggeration,
  thermoclineDepth,
  showThermocline = true,
  showCurrents = false,
  currentU = null,
  currentV = null,
}: OceanSceneProps) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const frameRef  = useRef<number>(0);
  const sceneRef  = useRef<THREE.Scene | null>(null);

  const build = useCallback(() => {
    if (!gridData || !mountRef.current) return;

    const mount = mountRef.current;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // ── Scene ────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020818);
    scene.fog = new THREE.FogExp2(0x020818, 0.025);
    sceneRef.current = scene;

    // ── Camera ───────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 5, 18);
    camera.lookAt(0, 0, 0);

    // ── Renderer ─────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // ── OCEAN SLICE ───────────────────────────────────────────────────────
    //
    //  CORRECT GEOMETRY:
    //    X = normalised longitude
    //    Y = -selectedDepth × exaggeration  (flat plane — depth is fixed)
    //    Z = normalised latitude
    //    COLOR = variable value (temperature/salinity/chlorophyll)
    //
    //  The slice is a FLAT horizontal plane.
    //  Moving the depth slider changes the Y position of the ENTIRE plane.
    //  The variable value NEVER determines the Y coordinate.
    //
    const depthScale = 0.003;  // 1000m → 3 units in scene space
    const planeY = -selectedDepth * depthScale * exaggeration;

    const sliceMesh = OceanSlice.build({
      gridData, lats, lons, colorMin, colorMax, palette, planeY,
    });
    scene.add(sliceMesh.mesh);
    scene.add(sliceMesh.wireMesh);

    // ── DEPTH AXIS ────────────────────────────────────────────────────────
    // Vertical axis labels at common oceanographic depths
    const depthMarkers = [0, 100, 200, 500, 1000, 2000];
    depthMarkers.forEach(d => {
      const y = -d * depthScale * exaggeration;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-5.5, y, -5.5),
        new THREE.Vector3(-5.2, y, -5.5),
      ]);
      const mat = new THREE.LineBasicMaterial({
        color: d === 0 ? 0x2b7fff : 0x1a3a6e,
        transparent: true,
        opacity: d === 0 ? 0.9 : 0.4,
      });
      scene.add(new THREE.Line(geo, mat));
    });

    // Vertical axis line
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5.5, 1, -5.5),
      new THREE.Vector3(-5.5, -2000 * depthScale * exaggeration, -5.5),
    ]);
    scene.add(new THREE.Line(
      axisGeo,
      new THREE.LineBasicMaterial({ color: 0x2b7fff, transparent: true, opacity: 0.5 })
    ));

    // ── THERMOCLINE PLANE ─────────────────────────────────────────────────
    if (showThermocline && thermoclineDepth != null) {
      const thermoY = -thermoclineDepth * depthScale * exaggeration;

      // Semi-transparent red plane
      const planeGeo = new THREE.PlaneGeometry(12, 12);
      const planeMat = new THREE.MeshBasicMaterial({
        color: 0xff3333,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.rotation.x = Math.PI / 2;
      plane.position.y = thermoY;
      scene.add(plane);

      // Dashed border
      const edges = new THREE.EdgesGeometry(planeGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0xff3333, transparent: true, opacity: 0.8
      });
      const edgeMesh = new THREE.LineSegments(edges, edgeMat);
      edgeMesh.rotation.x = Math.PI / 2;
      edgeMesh.position.y = thermoY;
      scene.add(edgeMesh);

      // Marker sphere on axis
      const markerGeo = new THREE.SphereGeometry(0.1, 12, 12);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(-5.5, thermoY, -5.5);
      scene.add(marker);
    }

    // ── CURRENT PARTICLES ─────────────────────────────────────────────────
    //
    //  NOTE: Particles are driven by the real U, V current fields when
    //  available. Without U/V data, they show a stylised flow pattern
    //  labelled as "Flow Visualisation" (not "Current Advection").
    //
    let particlePos: Float32Array | null = null;
    let particleSystem: THREE.Points | null = null;
    const count = 800;

    if (showCurrents) {
      particlePos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        particlePos[i * 3]     = (Math.random() - 0.5) * 10;
        particlePos[i * 3 + 1] = planeY + (Math.random() - 0.5) * 0.1;
        particlePos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.Float32BufferAttribute(particlePos, 3));
      particleSystem = new THREE.Points(pGeo, new THREE.PointsMaterial({
        color: 0x00d4ff, size: 0.07, transparent: true, opacity: 0.6,
      }));
      scene.add(particleSystem);
    }

    // ── GRID & OCEAN SURFACE ──────────────────────────────────────────────
    const gridHelper = new THREE.GridHelper(12, 12, 0x1a3a6e, 0x0d1a2e);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Ocean surface shimmer at y = 0
    const surfaceGeo = new THREE.PlaneGeometry(12, 12, 1, 1);
    const surfaceMat = new THREE.MeshBasicMaterial({
      color: 0x071428,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
    surface.rotation.x = Math.PI / 2;
    surface.position.y = 0.01;
    scene.add(surface);

    // ── LIGHTING ─────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x203060, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(5, 12, 8);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x4488ff, 0.5);
    fill.position.set(-6, 2, -6);
    scene.add(fill);

    // ── CONTROLS ─────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4;
    controls.maxDistance = 45;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.target.set(0, planeY, 0);  // orbit around the slice plane

    // ── RESIZE ───────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── ANIMATE ───────────────────────────────────────────────────────────
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();

      // Move particles using U/V if available, else stylised flow
      if (showCurrents && particlePos && particleSystem) {
        for (let i = 0; i < count; i++) {
          const px = particlePos[i * 3];
          const pz = particlePos[i * 3 + 2];

          let du = 0.008, dv = 0.005;

          if (currentU && currentV) {
            // Sample U/V from real field at particle position
            // Map scene [-5,5] → grid [0, cols-1] / [0, rows-1]
            const cols = currentU[0]?.length ?? 1;
            const rows = currentU.length;
            const ci = Math.round(((px + 5) / 10) * (cols - 1));
            const ri = Math.round(((pz + 5) / 10) * (rows - 1));
            const u = currentU[Math.max(0, Math.min(rows - 1, ri))]?.[Math.max(0, Math.min(cols - 1, ci))] ?? 0;
            const v = currentV[Math.max(0, Math.min(rows - 1, ri))]?.[Math.max(0, Math.min(cols - 1, ci))] ?? 0;
            du = u * 0.05;
            dv = v * 0.05;
          }

          particlePos[i * 3]     += du;
          particlePos[i * 3 + 2] += dv;

          // Wrap at scene boundaries
          if (particlePos[i * 3]     >  5.5) particlePos[i * 3]     = -5.5;
          if (particlePos[i * 3]     < -5.5) particlePos[i * 3]     =  5.5;
          if (particlePos[i * 3 + 2] >  5.5) particlePos[i * 3 + 2] = -5.5;
          if (particlePos[i * 3 + 2] < -5.5) particlePos[i * 3 + 2] =  5.5;
        }
        (particleSystem.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [gridData, lats, lons, colorMin, colorMax, palette, selectedDepth, exaggeration,
      thermoclineDepth, showThermocline, showCurrents, currentU, currentV]);

  useEffect(() => {
    const cleanup = build();
    return () => cleanup?.();
  }, [build]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
