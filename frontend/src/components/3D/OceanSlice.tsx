import * as THREE from 'three';

export type ColorPalette = 'thermal' | 'viridis' | 'plasma' | 'blues';

function thermalColor(t: number): THREE.Color {
  t = Math.max(0, Math.min(1, t));
  // Blue(0) → Cyan(0.25) → Green(0.5) → Yellow(0.75) → Red(1)
  if (t < 0.25) {
    const s = t / 0.25;
    return new THREE.Color(0, s, 1);
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return new THREE.Color(0, 1, 1 - s);
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return new THREE.Color(s, 1, 0);
  } else {
    const s = (t - 0.75) / 0.25;
    return new THREE.Color(1, 1 - s, 0);
  }
}

function viridisColor(t: number): THREE.Color {
  t = Math.max(0, Math.min(1, t));
  return new THREE.Color(
    0.267 + 0.004 * t - 0.326 * t * t + 0.832 * t * t * t,
    0.005 + 1.099 * t - 0.612 * t * t,
    0.329 + 1.498 * t - 3.006 * t * t + 1.673 * t * t * t,
  );
}

function getColor(val: number, min: number, max: number, palette: ColorPalette): THREE.Color {
  const t = max === min ? 0 : (val - min) / (max - min);
  const tc = Math.max(0, Math.min(1, t));
  switch (palette) {
    case 'viridis': return viridisColor(tc);
    case 'plasma': {
      // Blue→Purple→Orange
      return new THREE.Color().setHSL(0.75 - tc * 0.75, 1, 0.3 + tc * 0.3);
    }
    case 'blues': {
      return new THREE.Color(1 - tc * 0.9, 1 - tc * 0.6, 1);
    }
    default: return thermalColor(tc);
  }
}

interface SliceParams {
  gridData: number[][];
  lats: number[];
  lons: number[];
  colorMin: number;
  colorMax: number;
  palette: string;
  planeY: number;    // Y position of the plane in scene units = -depth × scale × exaggeration
}

interface SliceMesh {
  mesh: THREE.Mesh;
  wireMesh: THREE.Mesh;
}

/**
 * OceanSlice — builds the 3D horizontal ocean slice mesh.
 *
 * GEOMETRY CONTRACT:
 *   X = normalised longitude  ∈ [-5, 5]
 *   Y = planeY (FIXED — determined by selectedDepth, NOT by variable value)
 *   Z = normalised latitude   ∈ [-5, 5]
 *   vertex COLOR = variable value mapped through palette
 *
 * This is a flat plane. The variable value (temperature, salinity, etc.)
 * determines only the colour of each vertex, never its position.
 */
export const OceanSlice = {
  build({ gridData, lats, lons, colorMin, colorMax, palette, planeY }: SliceParams): SliceMesh {
    const rows = lats.length;
    const cols = lons.length;

    if (rows < 2 || cols < 2) {
      const g = new THREE.PlaneGeometry(10, 10);
      const m = new THREE.MeshBasicMaterial({ color: 0x1a3a6e, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(g, m);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.y = planeY;
      return { mesh, wireMesh: mesh.clone() };
    }

    const lonMin = lons[0],       lonMax = lons[cols - 1];
    const latMin = lats[0],       latMax = lats[rows - 1];
    const lonRange = lonMax - lonMin || 1;
    const latRange = latMax - latMin || 1;

    const vertices: number[] = [];
    const colors:   number[] = [];

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        // X = longitude normalised to [-5, 5]
        const x = ((lons[i] - lonMin) / lonRange) * 10 - 5;
        // Y = FIXED plane depth (never the variable value)
        const y = planeY;
        // Z = latitude normalised to [-5, 5]
        const z = ((lats[j] - latMin) / latRange) * 10 - 5;

        vertices.push(x, y, z);

        // Color = variable value
        const val = gridData[j]?.[i] ?? colorMin;
        const c = getColor(val, colorMin, colorMax, palette as ColorPalette);
        colors.push(c.r, c.g, c.b);
      }
    }

    // Triangulate grid
    const indices: number[] = [];
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = j * cols + i;
        const b = j * cols + i + 1;
        const c = (j + 1) * cols + i;
        const d = (j + 1) * cols + i + 1;
        indices.push(a, b, c, b, d, c);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      shininess: 50,
      specular: new THREE.Color(0x224488),
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x2b7fff,
      wireframe: true,
      transparent: true,
      opacity: 0.03,
    });

    return {
      mesh:     new THREE.Mesh(geometry, material),
      wireMesh: new THREE.Mesh(geometry.clone(), wireMat),
    };
  },
};
