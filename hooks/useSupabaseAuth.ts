import { useEffect } from "react";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/features/auth/authStore";

/**
 * @deprecated
 * Auth state is now bootstrapped directly inside the root _layout.tsx AuthGate.
 * This hook is kept as a no-op shim so any leftover import doesn't crash.
 */
export function useSupabaseAuth() {
  // No-op: logic moved to app/_layout.tsx AuthGate component
}
