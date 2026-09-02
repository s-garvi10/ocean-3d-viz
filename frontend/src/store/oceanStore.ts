import { create } from 'zustand';

export interface ComparisonResult {
  rmse: number | null;
  bias: number | null;
  skillScore: number | null;
  error?: string;
}

export interface OceanState {
  variable: 'temperature' | 'salinity' | 'chlorophyll';
  depth: number;
  time: string;
  isPlaying: boolean;
  palette: 'thermal' | 'viridis' | 'plasma' | 'blues';
  colorMin: number;
  colorMax: number;
  exaggeration: number;
  showPanel: boolean;
  showLearn: boolean;
  selectedArgoId: string | null;
  comparisonData: ComparisonResult | null;
  comparisonLoading: boolean;
  gridData: number[][];
  lats: number[];
  lons: number[];
  setVariable: (v: any) => void;
  setDepth: (d: number) => void;
  setTime: (t: string) => void;
  togglePlay: () => void;
  setPalette: (p: any) => void;
  setColorRange: (min: number, max: number) => void;
  setExaggeration: (e: number) => void;
  togglePanel: () => void;
  setLearn: (show: boolean) => void;
  selectArgo: (id: string | null) => void;
  setComparisonData: (data: ComparisonResult | null) => void;
  setComparisonLoading: (loading: boolean) => void;
  setGridData: (data: number[][], lats: number[], lons: number[]) => void;
}

export const useOceanStore = create<OceanState>((set) => ({
  variable: 'salinity',
  depth: 100,
  time: '2026-08-29',
  isPlaying: false,
  palette: 'thermal',
  colorMin: 33,
  colorMax: 37,
  exaggeration: 1.0,
  showPanel: true,
  showLearn: false,
  selectedArgoId: null,
  comparisonData: null,
  comparisonLoading: false,
  gridData: [],
  lats: [],
  lons: [],
  setVariable: (variable) => set({ variable }),
  setDepth: (depth) => set({ depth }),
  setTime: (time) => set({ time }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPalette: (palette) => set({ palette }),
  setColorRange: (min, max) => set({ colorMin: min, colorMax: max }),
  setExaggeration: (exaggeration) => set({ exaggeration }),
  togglePanel: () => set((state) => ({ showPanel: !state.showPanel })),
  setLearn: (showLearn) => set({ showLearn }),
  selectArgo: (selectedArgoId) => set({ selectedArgoId, comparisonData: null }),
  setComparisonData: (comparisonData) => set({ comparisonData }),
  setComparisonLoading: (comparisonLoading) => set({ comparisonLoading }),
  setGridData: (gridData, lats, lons) => set({ gridData, lats, lons }),
}));
