import { create } from "zustand";
import { supabase } from "@/services/supabase";
import { QueryClient } from "@tanstack/react-query";

// Shared query client reference — set once from _layout.tsx
let _queryClient: QueryClient | null = null;
export function setFollowQueryClient(qc: QueryClient) {
  _queryClient = qc;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FollowStore = {
  // Set of user IDs (not usernames) that the current user follows
  followingIds: Set<string>;
  // Map of username -> userId for lookup (populated as we encounter users)
  usernameToId: Record<string, string>;
  isLoaded: boolean;

  // Actions
  loadFollowing: (currentUserId: string) => Promise<void>;
  toggleFollow: (currentUserId: string, targetUserId: string, targetUsername: string) => Promise<void>;
  isFollowing: (usernameOrId: string) => boolean;
  registerUser: (username: string, userId: string) => void;
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFollowStore = create<FollowStore>((set, get) => ({
  followingIds: new Set<string>(),
  usernameToId: {},
  isLoaded: false,

  // Called once on app load — fetches all follows for the current user
  loadFollowing: async (currentUserId) => {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId);

      if (error) throw error;

      const ids = new Set<string>((data ?? []).map((row: any) => row.following_id as string));
      set({ followingIds: ids, isLoaded: true });
    } catch (e) {
      // Fail silently — app still works, just won't show follow state
      console.warn("followStore.loadFollowing error:", e);
      set({ isLoaded: true });
    }
  },

  // Optimistic toggle — updates UI instantly, rolls back on error
  toggleFollow: async (currentUserId, targetUserId, targetUsername) => {
    const { followingIds } = get();
    const alreadyFollowing = followingIds.has(targetUserId);

    // Optimistic update
    const newIds = new Set(followingIds);
    if (alreadyFollowing) {
      newIds.delete(targetUserId);
    } else {
      newIds.add(targetUserId);
    }
    set({ followingIds: newIds });

    // Persist to Supabase
    try {
      if (alreadyFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .upsert({
            follower_id: currentUserId,
            following_id: targetUserId,
          });
        if (error) throw error;
      }
      // Refresh the Following feed so new posts appear immediately
      _queryClient?.invalidateQueries({ queryKey: ["feed", "following"] });
    } catch (e) {
      // Roll back optimistic update
      console.warn("followStore.toggleFollow error:", e);
      set({ followingIds });
    }
  },

  // Check by either username or userId
  isFollowing: (usernameOrId) => {
    const { followingIds, usernameToId } = get();
    // Direct ID check first (fast path)
    if (followingIds.has(usernameOrId)) return true;
    // Username lookup fallback
    const resolvedId = usernameToId[usernameOrId];
    return resolvedId ? followingIds.has(resolvedId) : false;
  },

  // Called by FeedCard/ProfileHeader when they render a user
  // so we can resolve username -> userId for isFollowing checks
  registerUser: (username, userId) => {
    const { usernameToId } = get();
    if (usernameToId[username] === userId) return; // already registered
    set((s) => ({
      usernameToId: { ...s.usernameToId, [username]: userId },
    }));
  },
}));
