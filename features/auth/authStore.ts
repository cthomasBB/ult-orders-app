import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  authSignIn,
  authSignInWithApple,
  authSignInWithGoogle,
  authSignOut,
  authSignUp,
  fetchPublicUser,
  type PublicUser,
  type SignInPayload,
  type SignUpPayload,
} from "@/services/supabase";

// ─── State shape ──────────────────────────────────────────────────────────────

type AuthState = {
  // Data
  session: Session | null;
  user: User | null;
  publicUser: PublicUser | null;
  isLoading: boolean;
  /** Transient error message — cleared before each action */
  error: string | null;

  // Setters (used by the root layout auth listener)
  setSession: (session: Session | null) => void;
  setPublicUser: (publicUser: PublicUser | null) => void;
  clearError: () => void;

  // Bootstrap
  fetchPublicProfile: (uid: string) => Promise<void>;

  // Actions
  signUp: (payload: SignUpPayload) => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;

  // Legacy alias kept for backwards-compat with existing screens
  fetchProfile: (uid: string) => Promise<void>;
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  session: null,
  user: null,
  publicUser: null,
  isLoading: true,
  error: null,

  // ── Setters ────────────────────────────────────────────────────────────────
  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  setPublicUser: (publicUser) => set({ publicUser }),

  clearError: () => set({ error: null }),

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  fetchPublicProfile: async (uid) => {
    const publicUser = await fetchPublicUser(uid);
    set({ publicUser });
  },

  // Legacy alias
  fetchProfile: async (uid) => {
    const publicUser = await fetchPublicUser(uid);
    set({ publicUser });
  },

  // ── Sign up ────────────────────────────────────────────────────────────────
  signUp: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authSignUp(payload);
      const user = data.user ?? null;
      const session = data.session ?? null;

      if (user) {
        const publicUser = await fetchPublicUser(user.id);
        set({ session, user, publicUser, isLoading: false });
      } else {
        // Email confirmation required — session will be null
        set({ session: null, user: null, publicUser: null, isLoading: false });
      }
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? "Sign-up failed." });
      throw e; // re-throw so the screen can react
    }
  },

  // ── Sign in ────────────────────────────────────────────────────────────────
  signIn: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authSignIn(payload);
      const publicUser = data.user
        ? await fetchPublicUser(data.user.id)
        : null;
      set({
        session: data.session,
        user: data.user,
        publicUser,
        isLoading: false,
      });
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? "Sign-in failed." });
      throw e;
    }
  },

  // ── Sign out ───────────────────────────────────────────────────────────────
  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authSignOut();
      set({ session: null, user: null, publicUser: null, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? "Sign-out failed." });
      throw e;
    }
  },

  // ── Apple OAuth ────────────────────────────────────────────────────────────
  signInWithApple: async () => {
    set({ isLoading: true, error: null });
    try {
      await authSignInWithApple();
      // Session is handled by the onAuthStateChange listener in _layout.tsx
      set({ isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? "Apple sign-in failed." });
      throw e;
    }
  },

  // ── Google OAuth ───────────────────────────────────────────────────────────
  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      await authSignInWithGoogle();
      // Session is handled by the onAuthStateChange listener in _layout.tsx
      set({ isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? "Google sign-in failed." });
      throw e;
    }
  },
}));
