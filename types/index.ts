// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = "customer" | "vendor" | "admin";

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

// ─── Restaurant ───────────────────────────────────────────────────────────────

export type RestaurantStatus = "open" | "closed" | "busy";

export type Restaurant = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  cuisine_type: string[];
  status: RestaurantStatus;
  average_rating: number;
  total_reviews: number;
  place_id: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Menu ─────────────────────────────────────────────────────────────────────

export type MenuCategory = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  dietary_tags: string[];
  sort_order: number;
};

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item: MenuItem;
  quantity: number;
  unit_price: number;
  notes: string | null;
};

export type Order = {
  id: string;
  customer_id: string;
  restaurant_id: string;
  restaurant: Restaurant;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  notes: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Feed / Reviews ───────────────────────────────────────────────────────────

export type Review = {
  id: string;
  order_id: string;
  customer_id: string;
  customer: Profile;
  restaurant_id: string;
  rating: number;
  comment: string | null;
  image_urls: string[];
  created_at: string;
};

// ─── Create Flow (5-step) ─────────────────────────────────────────────────────

export type CreateOrderStep = 1 | 2 | 3 | 4 | 5;

export type CreateOrderDraft = {
  step: CreateOrderStep;
  restaurant_id: string | null;
  items: Array<{ menu_item_id: string; quantity: number; notes?: string }>;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  notes: string | null;
  scheduled_at: string | null;
};

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | "order_confirmed"
  | "order_preparing"
  | "order_ready"
  | "order_picked_up"
  | "order_delivered"
  | "order_cancelled"
  | "new_review"
  | "promo";

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
};
