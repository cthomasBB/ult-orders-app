import { create } from "zustand";
import type { CreateOrderDraft, Order } from "@/types";

const initialDraft: CreateOrderDraft = {
  step: 1,
  restaurant_id: null,
  items: [],
  delivery_address: null,
  delivery_latitude: null,
  delivery_longitude: null,
  notes: null,
  scheduled_at: null,
};

type OrdersState = {
  // Active order being created
  draft: CreateOrderDraft;

  // Recent orders cache
  orders: Order[];
  activeOrder: Order | null;

  // Draft actions
  setDraftRestaurant: (restaurantId: string) => void;
  addDraftItem: (menuItemId: string, quantity?: number, notes?: string) => void;
  removeDraftItem: (menuItemId: string) => void;
  updateDraftItemQty: (menuItemId: string, quantity: number) => void;
  setDraftDelivery: (address: string, lat: number, lng: number) => void;
  setDraftNotes: (notes: string) => void;
  setDraftSchedule: (scheduledAt: string | null) => void;
  setDraftStep: (step: CreateOrderDraft["step"]) => void;
  resetDraft: () => void;

  // Order actions
  setOrders: (orders: Order[]) => void;
  setActiveOrder: (order: Order | null) => void;
  upsertOrder: (order: Order) => void;
};

export const useOrdersStore = create<OrdersState>((set) => ({
  draft: initialDraft,
  orders: [],
  activeOrder: null,

  setDraftRestaurant: (restaurantId) =>
    set((s) => ({
      draft: { ...s.draft, restaurant_id: restaurantId, items: [] },
    })),

  addDraftItem: (menuItemId, quantity = 1, notes) =>
    set((s) => {
      const existing = s.draft.items.find((i) => i.menu_item_id === menuItemId);
      const items = existing
        ? s.draft.items.map((i) =>
            i.menu_item_id === menuItemId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        : [...s.draft.items, { menu_item_id: menuItemId, quantity, notes }];
      return { draft: { ...s.draft, items } };
    }),

  removeDraftItem: (menuItemId) =>
    set((s) => ({
      draft: {
        ...s.draft,
        items: s.draft.items.filter((i) => i.menu_item_id !== menuItemId),
      },
    })),

  updateDraftItemQty: (menuItemId, quantity) =>
    set((s) => ({
      draft: {
        ...s.draft,
        items:
          quantity <= 0
            ? s.draft.items.filter((i) => i.menu_item_id !== menuItemId)
            : s.draft.items.map((i) =>
                i.menu_item_id === menuItemId ? { ...i, quantity } : i
              ),
      },
    })),

  setDraftDelivery: (delivery_address, delivery_latitude, delivery_longitude) =>
    set((s) => ({
      draft: {
        ...s.draft,
        delivery_address,
        delivery_latitude,
        delivery_longitude,
      },
    })),

  setDraftNotes: (notes) =>
    set((s) => ({ draft: { ...s.draft, notes } })),

  setDraftSchedule: (scheduled_at) =>
    set((s) => ({ draft: { ...s.draft, scheduled_at } })),

  setDraftStep: (step) =>
    set((s) => ({ draft: { ...s.draft, step } })),

  resetDraft: () => set({ draft: initialDraft }),

  setOrders: (orders) => set({ orders }),

  setActiveOrder: (activeOrder) => set({ activeOrder }),

  upsertOrder: (order) =>
    set((s) => ({
      orders: s.orders.some((o) => o.id === order.id)
        ? s.orders.map((o) => (o.id === order.id ? order : o))
        : [order, ...s.orders],
      activeOrder: s.activeOrder?.id === order.id ? order : s.activeOrder,
    })),
}));
