import { create } from 'zustand';

interface AppState {
  isLoggedIn: boolean;
  currentPage: string;
  selectedPlanillas: string[];
  selectedSede: string;
  selectedDate: string;
  login: () => void;
  logout: () => void;
  setCurrentPage: (page: string) => void;
  setSelectedPlanillas: (ids: string[]) => void;
  togglePlanilla: (id: string) => void;
  setSelectedSede: (sede: string) => void;
  setSelectedDate: (date: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoggedIn: false,
  currentPage: 'planillas',
  selectedPlanillas: [],
  selectedSede: 'Donmatías',
  selectedDate: '11/04/2026',
  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false, currentPage: 'planillas' }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedPlanillas: (ids) => set({ selectedPlanillas: ids }),
  togglePlanilla: (id) => set((state) => ({
    selectedPlanillas: state.selectedPlanillas.includes(id)
      ? state.selectedPlanillas.filter(p => p !== id)
      : [...state.selectedPlanillas, id]
  })),
  setSelectedSede: (sede) => set({ selectedSede: sede }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
