import { create } from 'zustand';

export interface ComparisonResult {
  rmse: number | null;
  bias: number | null;
  correlation: number | null;
  mae: number | null;
  matchedPoints: number;
  error?: string;
}

export interface OceanState {
  // --- Core Data ---
  variable: 'temperature' | 'salinity' | 'chlorophyll';
  depth: number;
  time: string;
  region: 'North Indian Ocean' | 'Arabian Sea' | 'Bay of Bengal' | 'Andaman Sea' | 'Lakshadweep Sea';
  displayMode: '3dglobe' | 'depthcurtain' | 'isosurface' | 'volume';
  palette: 'thermal' | 'viridis' | 'plasma' | 'blues';
  colorMin: number;
  colorMax: number;
  exaggeration: number;
  isPlaying: boolean;
  opacity: number;

  // --- Layer Toggles ---
  showModel: boolean;
  showArgo: boolean;
  showCurrents: boolean;
  showThermocline: boolean;
  showGrid: boolean;
  showCoastlines: boolean;

  // --- Data Payloads ---
  gridData: number[][];
  lats: number[];
  lons: number[];
  timesteps: string[];
  depths: number[];

  // --- Argo System ---
  argoFloats: any[];
  selectedArgoId: string | null;
  selectedProfile: any | null;
  comparison: ComparisonResult | null;
  thermocline: { depth: number; gradient: number } | null;

  // --- Status ---
  isLoading: boolean;
  error: string | null;
  lastUpdated: string;

  // --- Actions ---
  setVariable: (v: any) => void;
  setDepth: (d: number) => void;
  setTime: (t: string) => void;
  setRegion: (r: any) => void;
  setDisplayMode: (m: any) => void;
  setPalette: (p: any) => void;
  setColorRange: (min: number, max: number) => void;
  setExaggeration: (e: number) => void;
  togglePlay: () => void;
  toggleLayer: (layer: string) => void;
  setGridData: (data: number[][], lats: number[], lons: number[]) => void;
  setArgoFloats: (floats: any[]) => void;
  selectArgo: (id: string | null) => void;
  setProfile: (profile: any) => void;
  setComparison: (comp: ComparisonResult | null) => void;
  setThermocline: (tc: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTimesteps: (times: string[]) => void;
  setDepths: (depths: number[]) => void;
}

export const useOceanStore = create<OceanState>((set) => ({
  // --- Defaults ---
  variable: 'temperature',
  depth: 125,
  time: '27 Aug 2026 12:00 UTC',
  region: 'North Indian Ocean',
  displayMode: 'depthcurtain',
  palette: 'thermal',
  colorMin: 15,
  colorMax: 32,
  exaggeration: 1.0,
  isPlaying: false,
  opacity: 0.85,
  showModel: true,
  showArgo: true,
  showCurrents: false,
  showThermocline: false,
  showGrid: false,
  showCoastlines: true,
  gridData: [],
  lats: [],
  lons: [],
  timesteps: ['28 Aug 2026', '29 Aug 2026', '30 Aug 2026'],
  depths: [0, 10, 25, 50, 100, 200, 500, 1000],
  argoFloats: [],
  selectedArgoId: null,
  selectedProfile: null,
  comparison: null,
  thermocline: null,
  isLoading: false,
  error: null,
  lastUpdated: new Date().toISOString(),

  // --- Actions ---
  setVariable: (variable) => set({ variable }),
  setDepth: (depth) => set({ depth }),
  setTime: (time) => set({ time }),
  setRegion: (region) => set({ region }),
  setDisplayMode: (displayMode) => set({ displayMode }),
  setPalette: (palette) => set({ palette }),
  setColorRange: (colorMin, colorMax) => set({ colorMin, colorMax }),
  setExaggeration: (exaggeration) => set({ exaggeration }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleLayer: (layer) => {
    const map: Record<string, keyof OceanState> = {
      showModel: 'showModel',
      showArgo: 'showArgo',
      showCurrents: 'showCurrents',
      showThermocline: 'showThermocline',
      showGrid: 'showGrid',
      showCoastlines: 'showCoastlines',
    };
    const key = map[layer];
    if (key) set((state) => ({ ...state, [key]: !state[key] }));
  },
  setGridData: (gridData, lats, lons) => set({ gridData, lats, lons }),
  setArgoFloats: (argoFloats) => set({ argoFloats }),
  selectArgo: (selectedArgoId) => set({ selectedArgoId, comparison: null, thermocline: null }),
  setProfile: (selectedProfile) => set({ selectedProfile }),
  setComparison: (comparison) => set({ comparison }),
  setThermocline: (thermocline) => set({ thermocline }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setTimesteps: (timesteps) => set({ timesteps }),
  setDepths: (depths) => set({ depths }),
}));
