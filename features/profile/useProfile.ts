import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { analytics } from "@/services/analytics";
import { useAuthStore } from "@/features/auth/authStore";
import { getStatusLevel } from "@/types/profile";
import type {
  UserProfile,
  UserBadge,
  ViewerRelation,
} from "@/types/profile";

// ─── Fetch helpers ────────────────────────────────────────────────────────────

export async function fetchUserProfile(username: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id, username, display_name, avatar_url, taste_tags,
      is_verified, is_suggested,
      follower_count, following_count, ult_order_count,
      created_at
    `)
    .eq("username", username)
    .single();

  if (error || !data) return null;

  // Derive city from metadata (add to users table in future if needed)
  const profile = data as any;

  return {
    ...profile,
    bio: profile.bio ?? null,
    city: profile.city ?? null,
    status_level: getStatusLevel(profile.ult_order_count ?? 0),
  } as UserProfile;
}

async function fetchUserBadges(userId: string): Promise<UserBadge[]> {
  const { data } = await supabase
    .from("user_badges")
    .select(`
      id, is_featured, awarded_at,
      badge:badges!badge_id (slug, name, description, icon_url, category)
    `)
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false })
    .limit(10);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    slug: row.badge?.slug ?? "",
    name: row.badge?.name ?? "",
    description: row.badge?.description ?? "",
    icon_url: row.badge?.icon_url ?? null,
    category: row.badge?.category ?? "general",
    is_featured: row.is_featured,
    awarded_at: row.awarded_at,
  }));
}

async function fetchViewerRelation(
  viewerUserId: string,
  targetUserId: string
): Promise<ViewerRelation> {
  if (viewerUserId === targetUserId) {
    return { is_following: false, is_followed_by: false, is_own_profile: true };
  }

  const [{ data: following }, { data: follower }] = await Promise.all([
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewerUserId)
      .eq("following_id", targetUserId)
      .single(),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", targetUserId)
      .eq("following_id", viewerUserId)
      .single(),
  ]);

  return {
    is_following: !!following,
    is_followed_by: !!follower,
    is_own_profile: false,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ["user-profile", username],
    queryFn: () => fetchUserProfile(username),
    staleTime: 1000 * 60 * 3,
    enabled: !!username,
  });
}

export function useUserBadges(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-badges", userId],
    queryFn: () => fetchUserBadges(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useViewerRelation(
  viewerUserId: string | undefined,
  targetUserId: string | undefined
) {
  return useQuery({
    queryKey: ["viewer-relation", viewerUserId, targetUserId],
    queryFn: () => fetchViewerRelation(viewerUserId!, targetUserId!),
    enabled: !!viewerUserId && !!targetUserId,
    staleTime: 1000 * 60,
  });
}

// ─── Follow / unfollow mutation ───────────────────────────────────────────────

export function useToggleFollow(targetUsername: string) {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      isFollowing,
    }: {
      targetUserId: string;
      isFollowing: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
      } else {
        await supabase.from("follows").upsert({
          follower_id: user.id,
          following_id: targetUserId,
        });
      }
    },
    onMutate: async ({ targetUserId, isFollowing }) => {
      // ── PostHog event ──
      analytics.capture(isFollowing ? "user_unfollowed" : "user_followed", {
        target_user_id: targetUserId,
        source: "profile",
      });
      // Optimistic: flip is_following in the viewer relation cache
      qc.setQueryData<ViewerRelation>(
        ["viewer-relation", user?.id, targetUserId],
        (old) => old ? { ...old, is_following: !isFollowing } : old
      );
      // Optimistic: update follower_count on the target profile
      qc.setQueryData<UserProfile>(
        ["user-profile", targetUsername],
        (old) =>
          old
            ? {
                ...old,
                follower_count: old.follower_count + (isFollowing ? -1 : 1),
              }
            : old
      );
    },
    onError: (_, { targetUserId, isFollowing }) => {
      // Rollback
      qc.setQueryData<ViewerRelation>(
        ["viewer-relation", user?.id, targetUserId],
        (old) => old ? { ...old, is_following: isFollowing } : old
      );
      qc.setQueryData<UserProfile>(
        ["user-profile", targetUsername],
        (old) =>
          old
            ? {
                ...old,
                follower_count: old.follower_count + (isFollowing ? 1 : -1),
              }
            : old
      );
    },
  });
}
