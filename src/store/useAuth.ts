import { create } from "zustand";

type AuthState = {
  userId: string | null;
  signIn: (id: string) => void;
  signOut: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  userId: null,
  signIn: (id) => set({ userId: id }),
  signOut: () => set({ userId: null }),
}));
