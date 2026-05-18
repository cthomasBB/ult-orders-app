import { create } from "zustand";
import type { Restaurant, Review } from "@/types";

type FeedFilters = {
  cuisine: string[];
  maxDistance: number; // km
  minRating: number;
  openNow: boolean;
};

type FeedState = {
  restaurants: Restaurant[];
  reviews: Review[];
  filters: FeedFilters;
  searchQuery: string;
  userLocation: { lat: number; lng: number } | null;

  // Actions
  setRestaurants: (restaurants: Restaurant[]) => void;
  setReviews: (reviews: Review[]) => void;
  setFilters: (filters: Partial<FeedFilters>) => void;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
};

const defaultFilters: FeedFilters = {
  cuisine: [],
  maxDistance: 10,
  minRating: 0,
  openNow: false,
};

export const useFeedStore = create<FeedState>((set) => ({
  restaurants: [],
  reviews: [],
  filters: defaultFilters,
  searchQuery: "",
  userLocation: null,

  setRestaurants: (restaurants) => set({ restaurants }),
  setReviews: (reviews) => set({ reviews }),

  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),

  resetFilters: () => set({ filters: defaultFilters }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setUserLocation: (userLocation) => set({ userLocation }),
}));
