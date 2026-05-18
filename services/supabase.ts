import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

// ─── Client ───────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars.\n" +
      "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type PublicUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  taste_tags: string[];
  created_at: string;
};

export type SignUpPayload = {
  email: string;
  password: string;
  username: string;
  display_name?: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/** Sign up with email/password + insert row in public.users */
export async function authSignUp({ email, password, username, display_name }: SignUpPayload) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: display_name ?? username } },
  });
  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("Sign-up succeeded but no user was returned.");

  const { error: profileError } = await supabase.from("users").upsert(
    {
      id: user.id,
      username,
      display_name: display_name ?? username,
      avatar_url: null,
      taste_tags: [],
      created_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (profileError) throw profileError;

  return data;
}

/** Sign in with email/password */
export async function authSignIn({ email, password }: SignInPayload) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Sign out */
export async function authSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Sign in with Apple (OAuth) */
export async function authSignInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo: "ultorders://auth/callback" },
  });
  if (error) throw error;
  return data;
}

/** Sign in with Google (OAuth) */
export async function authSignInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: "ultorders://auth/callback" },
  });
  if (error) throw error;
  return data;
}

/** Send password reset email */
export async function authResetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "ultorders://auth/reset-password",
  });
  if (error) throw error;
}

/** Get current session */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/** Get current auth user */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/** Fetch public.users row */
export async function fetchPublicUser(uid: string): Promise<PublicUser | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", uid).single();
  if (error) return null;
  return data as PublicUser;
}

/** Save taste tags for a user */
export async function saveTasteTags(uid: string, tags: string[]) {
  const { error } = await supabase.from("users").update({ taste_tags: tags }).eq("id", uid);
  if (error) throw error;
}
