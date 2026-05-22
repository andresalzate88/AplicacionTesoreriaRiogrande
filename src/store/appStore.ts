import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

export interface Perfil {
  id: string;
  nombre: string;
  rol: string;
  sede_id: string;
  sede_nombre: string;
}

interface AppState {
  isLoggedIn: boolean;
  isInitializing: boolean;
  user: User | null;
  perfil: Perfil | null;
  rol: string | null;
  sedeId: string | null;
  currentPage: string;
  selectedPlanillas: string[];
  selectedSede: string;
  selectedDate: string;
  login: (user: User, perfil: Perfil) => void;
  logout: () => void;
  setInitializing: (value: boolean) => void;
  setCurrentPage: (page: string) => void;
  setSelectedPlanillas: (ids: string[]) => void;
  togglePlanilla: (id: string) => void;
  setSelectedSede: (sede: string) => void;
  setSelectedDate: (date: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoggedIn: false,
  isInitializing: true,
  user: null,
  perfil: null,
  rol: null,
  sedeId: null,
  currentPage: 'planillas',
  selectedPlanillas: [],
  selectedSede: 'Donmatías',
  selectedDate: '11/04/2026',
  login: (user, perfil) => set({
    isLoggedIn: true,
    user,
    perfil,
    rol: perfil.rol,
    sedeId: perfil.sede_id,
  }),
  logout: () => set({
    isLoggedIn: false,
    user: null,
    perfil: null,
    rol: null,
    sedeId: null,
    currentPage: 'planillas',
  }),
  setInitializing: (value) => set({ isInitializing: value }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedPlanillas: (ids) => set({ selectedPlanillas: ids }),
  togglePlanilla: (id) => set((state) => ({
    selectedPlanillas: state.selectedPlanillas.includes(id)
      ? state.selectedPlanillas.filter(p => p !== id)
      : [...state.selectedPlanillas, id],
  })),
  setSelectedSede: (sede) => set({ selectedSede: sede }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
