import { create } from "zustand";
import { supabase } from "@/services/supabase";
import type { Restaurant } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SavedState = {
  savedIds: Set<string>;           // restaurant IDs the user has saved
  savedRestaurants: Restaurant[];  // hydrated restaurant objects
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSaved: (userId: string) => Promise<void>;
  toggleSaved: (userId: string, restaurant: Restaurant) => Promise<void>;
  isSaved: (restaurantId: string) => boolean;
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSavedStore = create<SavedState>((set, get) => ({
  savedIds: new Set(),
  savedRestaurants: [],
  isLoading: false,
  error: null,

  // Fetch all saved restaurant IDs + hydrated objects for the user
  loadSaved: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("saved_restaurants")
        .select("restaurant_id, restaurants(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ids = new Set((data ?? []).map((row: any) => row.restaurant_id as string));
      const restaurants = (data ?? [])
        .map((row: any) => row.restaurants as Restaurant)
        .filter(Boolean);

      set({ savedIds: ids, savedRestaurants: restaurants, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? "Failed to load saved." });
    }
  },

  // Toggle a restaurant saved state (optimistic update)
  toggleSaved: async (userId, restaurant) => {
    const { savedIds, savedRestaurants } = get();
    const id = restaurant.id;
    const alreadySaved = savedIds.has(id);

    // Optimistic update
    const newIds = new Set(savedIds);
    let newRestaurants: Restaurant[];

    if (alreadySaved) {
      newIds.delete(id);
      newRestaurants = savedRestaurants.filter((r) => r.id !== id);
    } else {
      newIds.add(id);
      newRestaurants = [restaurant, ...savedRestaurants];
    }
    set({ savedIds: newIds, savedRestaurants: newRestaurants });

    // Persist
    try {
      if (alreadySaved) {
        await supabase
          .from("saved_restaurants")
          .delete()
          .eq("user_id", userId)
          .eq("restaurant_id", id);
      } else {
        await supabase
          .from("saved_restaurants")
          .upsert({ user_id: userId, restaurant_id: id });
      }
    } catch {
      // Roll back on error
      set({ savedIds, savedRestaurants });
    }
  },

  isSaved: (restaurantId) => get().savedIds.has(restaurantId),
}));
