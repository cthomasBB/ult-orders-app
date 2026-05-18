import { create } from "zustand";
import type { ImagePickerAsset } from "expo-image-picker";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateStep = 1 | 2 | 3 | 4 | 5;

/** A single item row in step 2 */
export type DraftItem = {
  id: string;           // local uuid for list keys
  name: string;
  modifications: string;
  price: string;        // display string e.g. "12.99"
  isPrimary: boolean;   // first item gets the ember dot
};

/** Resolved restaurant (from Places API or manual entry) */
export type DraftRestaurant = {
  placeId: string | null;  // null = manually entered
  name: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

/** Selected media asset */
export type DraftMedia = {
  id: string;
  asset: ImagePickerAsset;
  type: "photo" | "video";
  localUri: string;
  uploadedUrl: string | null;  // null until uploaded
  storagePath: string | null;
};

export type BestFor =
  | "date_night"
  | "solo"
  | "group"
  | "working_lunch"
  | "celebration"
  | "late_night"
  | "quick_bite";

export type ValueRating = 1 | 2 | 3 | 4 | 5;

export type ComplexityLevel = "simple" | "complex";

export type CreateOrderDraft = {
  // Navigation
  step: CreateStep;

  // Step 1 — Restaurant
  restaurant: DraftRestaurant | null;

  // Step 2 — Items
  items: DraftItem[];

  // Step 3 — Media
  media: DraftMedia[];

  // Step 4 — Details
  caption: string;
  tags: string[];
  // "Add extras" section
  title: string;
  bestFor: BestFor | null;
  valueRating: ValueRating | null;
  complexity: ComplexityLevel | null;

  // Submission state
  isSubmitting: boolean;
  submitError: string | null;
  submittedUltOrderId: string | null;
};

// ─── Initial state ────────────────────────────────────────────────────────────

function makeInitialDraft(): CreateOrderDraft {
  return {
    step: 1,
    restaurant: null,
    items: [makeDraftItem(true)],
    media: [],
    caption: "",
    tags: [],
    title: "",
    bestFor: null,
    valueRating: null,
    complexity: null,
    isSubmitting: false,
    submitError: null,
    submittedUltOrderId: null,
  };
}

let itemCounter = 0;
function makeDraftItem(isPrimary = false): DraftItem {
  return {
    id: `item-${Date.now()}-${++itemCounter}`,
    name: "",
    modifications: "",
    price: "",
    isPrimary,
  };
}

let mediaCounter = 0;
export function makeDraftMedia(asset: ImagePickerAsset): DraftMedia {
  return {
    id: `media-${Date.now()}-${++mediaCounter}`,
    asset,
    type: asset.type === "video" ? "video" : "photo",
    localUri: asset.uri,
    uploadedUrl: null,
    storagePath: null,
  };
}

// ─── Store shape ──────────────────────────────────────────────────────────────

type CreateOrderStore = {
  draft: CreateOrderDraft;

  // Navigation
  goToStep: (step: CreateStep) => void;
  goNext: () => void;
  goBack: () => void;

  // Step 1 — Restaurant
  setRestaurant: (restaurant: DraftRestaurant) => void;
  clearRestaurant: () => void;

  // Step 2 — Items
  addItem: () => void;
  removeItem: (id: string) => void;
  updateItemName: (id: string, name: string) => void;
  updateItemMods: (id: string, mods: string) => void;
  reorderItems: (fromIndex: number, toIndex: number) => void;

  // Step 3 — Media
  addMedia: (media: DraftMedia) => void;
  removeMedia: (id: string) => void;
  setMediaUploaded: (id: string, url: string, path: string) => void;

  // Step 4 — Details
  setCaption: (caption: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setTitle: (title: string) => void;
  setBestFor: (bestFor: BestFor | null) => void;
  setValueRating: (rating: ValueRating | null) => void;
  setComplexity: (complexity: ComplexityLevel | null) => void;

  // Submission
  setSubmitting: (v: boolean) => void;
  setSubmitError: (err: string | null) => void;
  setSubmittedId: (id: string) => void;

  // Reset
  reset: () => void;
};

// ─── Store ────────────────────────────────────────────────────────────────────

const MAX_ITEMS = 8;
const MAX_TAGS = 5;
const MAX_PHOTOS = 3;

export const useCreateOrderStore = create<CreateOrderStore>((set, get) => ({
  draft: makeInitialDraft(),

  // ── Navigation ──────────────────────────────────────────────────────────────

  goToStep: (step) =>
    set((s) => ({ draft: { ...s.draft, step } })),

  goNext: () =>
    set((s) => ({
      draft: {
        ...s.draft,
        step: Math.min(s.draft.step + 1, 5) as CreateStep,
      },
    })),

  goBack: () =>
    set((s) => ({
      draft: {
        ...s.draft,
        step: Math.max(s.draft.step - 1, 1) as CreateStep,
      },
    })),

  // ── Step 1 ──────────────────────────────────────────────────────────────────

  setRestaurant: (restaurant) =>
    set((s) => ({ draft: { ...s.draft, restaurant } })),

  clearRestaurant: () =>
    set((s) => ({ draft: { ...s.draft, restaurant: null } })),

  // ── Step 2 ──────────────────────────────────────────────────────────────────

  addItem: () =>
    set((s) => {
      if (s.draft.items.length >= MAX_ITEMS) return s;
      return {
        draft: {
          ...s.draft,
          items: [...s.draft.items, makeDraftItem(false)],
        },
      };
    }),

  removeItem: (id) =>
    set((s) => {
      const filtered = s.draft.items.filter((i) => i.id !== id);
      // Ensure first item is always primary
      const items = filtered.map((item, idx) => ({
        ...item,
        isPrimary: idx === 0,
      }));
      return { draft: { ...s.draft, items } };
    }),

  updateItemName: (id, name) =>
    set((s) => ({
      draft: {
        ...s.draft,
        items: s.draft.items.map((i) => (i.id === id ? { ...i, name } : i)),
      },
    })),

  updateItemMods: (id, modifications) =>
    set((s) => ({
      draft: {
        ...s.draft,
        items: s.draft.items.map((i) =>
          i.id === id ? { ...i, modifications } : i
        ),
      },
    })),

  reorderItems: (fromIndex, toIndex) =>
    set((s) => {
      const items = [...s.draft.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      const reindexed = items.map((item, idx) => ({
        ...item,
        isPrimary: idx === 0,
      }));
      return { draft: { ...s.draft, items: reindexed } };
    }),

  // ── Step 3 ──────────────────────────────────────────────────────────────────

  addMedia: (media) =>
    set((s) => {
      const hasVideo = s.draft.media.some((m) => m.type === "video");
      const photoCount = s.draft.media.filter((m) => m.type === "photo").length;

      // Enforce limits: 1 video OR up to 3 photos
      if (media.type === "video" && (hasVideo || s.draft.media.length > 0))
        return s;
      if (media.type === "photo" && (hasVideo || photoCount >= MAX_PHOTOS))
        return s;

      return { draft: { ...s.draft, media: [...s.draft.media, media] } };
    }),

  removeMedia: (id) =>
    set((s) => ({
      draft: { ...s.draft, media: s.draft.media.filter((m) => m.id !== id) },
    })),

  setMediaUploaded: (id, url, path) =>
    set((s) => ({
      draft: {
        ...s.draft,
        media: s.draft.media.map((m) =>
          m.id === id
            ? { ...m, uploadedUrl: url, storagePath: path }
            : m
        ),
      },
    })),

  // ── Step 4 ──────────────────────────────────────────────────────────────────

  updateItemPrice: (id, price) =>
    set((s) => ({
      draft: {
        ...s.draft,
        items: s.draft.items.map((i) =>
          i.id === id ? { ...i, price } : i
        ),
      },
    })),
  setCaption: (caption) =>
    set((s) => ({ draft: { ...s.draft, caption } })),

  addTag: (rawTag) =>
    set((s) => {
      if (s.draft.tags.length >= MAX_TAGS) return s;
      const tag = rawTag.trim().toLowerCase().replace(/\s+/g, "_");
      if (!tag || s.draft.tags.includes(tag)) return s;
      return { draft: { ...s.draft, tags: [...s.draft.tags, tag] } };
    }),

  removeTag: (tag) =>
    set((s) => ({
      draft: {
        ...s.draft,
        tags: s.draft.tags.filter((t) => t !== tag),
      },
    })),

  setTitle: (title) =>
    set((s) => ({ draft: { ...s.draft, title } })),

  setBestFor: (bestFor) =>
    set((s) => ({ draft: { ...s.draft, bestFor } })),

  setValueRating: (valueRating) =>
    set((s) => ({ draft: { ...s.draft, valueRating } })),

  setComplexity: (complexity) =>
    set((s) => ({ draft: { ...s.draft, complexity } })),

  // ── Submission ──────────────────────────────────────────────────────────────

  setSubmitting: (isSubmitting) =>
    set((s) => ({ draft: { ...s.draft, isSubmitting } })),

  setSubmitError: (submitError) =>
    set((s) => ({ draft: { ...s.draft, submitError } })),

  setSubmittedId: (submittedUltOrderId) =>
    set((s) => ({ draft: { ...s.draft, submittedUltOrderId } })),

  // ── Reset ───────────────────────────────────────────────────────────────────

  reset: () => set({ draft: makeInitialDraft() }),
}));
