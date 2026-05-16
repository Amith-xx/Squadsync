"use client";

import { create } from "zustand";
import type { Position, PlayerAttributes, BanType } from "@/types";

// ─── User Store State ─────────────────────────────────────────────────────────

interface UserState {
  id: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  position: Position | null;
  attributes: PlayerAttributes | null;
  karmaScore: number;
  isBanned: boolean;
  banType: BanType;
  onboardingComplete: boolean;
  matchesPlayed: number;
  region: string | null;
  isLoading: boolean;
}

interface UserActions {
  setUser: (user: Partial<UserState>) => void;
  setKarma: (karmaScore: number, isBanned: boolean, banType: BanType) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setRegion: (region: string) => void;
  setLoading: (isLoading: boolean) => void;
  clearUser: () => void;
}

const initialState: UserState = {
  id: null,
  name: null,
  email: null,
  image: null,
  position: null,
  attributes: null,
  karmaScore: 70,
  isBanned: false,
  banType: null,
  onboardingComplete: false,
  matchesPlayed: 0,
  region: null,
  isLoading: true,
};

export const useUserStore = create<UserState & UserActions>((set) => ({
  ...initialState,

  setUser: (user) => set((state) => ({ ...state, ...user })),

  setKarma: (karmaScore, isBanned, banType) =>
    set({ karmaScore, isBanned, banType }),

  setOnboardingComplete: (complete) =>
    set({ onboardingComplete: complete }),

  setRegion: (region) => set({ region }),

  setLoading: (isLoading) => set({ isLoading }),

  clearUser: () => set(initialState),
}));
