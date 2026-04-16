import { create } from 'zustand';
import type { Profile, ScanResult } from '../lib/types';

interface SiftStore {
  user: Profile | null;
  scans: ScanResult[];
  currentScan: ScanResult | null;
  isAnalyzing: boolean;
  setUser: (user: Profile | null) => void;
  setScans: (scans: ScanResult[]) => void;
  setCurrentScan: (scan: ScanResult | null) => void;
  setIsAnalyzing: (value: boolean) => void;
  addScan: (scan: ScanResult) => void;
}

export const useSiftStore = create<SiftStore>((set) => ({
  user: null,
  scans: [],
  currentScan: null,
  isAnalyzing: false,
  setUser: (user) => set({ user }),
  setScans: (scans) => set({ scans }),
  setCurrentScan: (currentScan) => set({ currentScan }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  addScan: (scan) => set((state) => ({ scans: [scan, ...state.scans] })),
}));
