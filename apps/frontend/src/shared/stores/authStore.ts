'use client';

import { create } from 'zustand';
import { User } from '@toy-monorepo/types';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null; // 현재 로그인한 사용자 정보
  isLoading: boolean; // 로딩 상태
  isAuthenticated: boolean; // 인증 상태

  setUser: (user: User) => void;
  fetchCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),

  fetchCurrentUser: async () => {
    try {
      set({ isLoading: true });
      const user = await authApi.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },
}));
