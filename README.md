# 🍔 ult-orders

A full-featured food ordering app built with **Expo SDK 51**, **Expo Router v3**, **Supabase**, **Zustand**, and **TanStack Query**.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 51 + Expo Router v3 |
| Backend | Supabase (Auth, DB, Storage, Realtime) |
| State | Zustand |
| Data fetching | TanStack React Query v5 |
| Navigation | Expo Router (file-based) |
| Notifications | expo-notifications |
| Location | expo-location |
| Image upload | expo-image-picker |
| Icons | @expo/vector-icons (Ionicons) |
| Safe area | react-native-safe-area-context |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase project URL and anon key from [supabase.com](https://supabase.com).

### 3. Run the Supabase migration

Via the Supabase CLI:
```bash
supabase db push
```

Or paste the contents of `supabase/migrations/20240101000000_initial_schema.sql` directly into the Supabase SQL editor.

### 4. Create storage buckets

In the Supabase dashboard, create three **public** buckets:
- `avatars`
- `restaurant-images`
- `review-images`

### 5. Start the dev server

```bash
npx expo start
```

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

---

## Project Structure

```
ult-orders/
├── app/
│   ├── (auth)/                   # Auth screens (sign-in, sign-up, forgot-password)
│   ├── (tabs)/                   # Main tab screens (feed, search, orders, profile)
│   ├── order/[id].tsx            # Order detail + live status tracker
│   ├── restaurant/[id].tsx       # Restaurant menu + add-to-cart
│   ├── profile/[username].tsx    # Public profile view
│   └── create/                   # 5-step order creation flow
│       ├── step-1-restaurant.tsx
│       ├── step-2-items.tsx
│       ├── step-3-delivery.tsx
│       ├── step-4-review.tsx
│       └── step-5-confirm.tsx
├── components/
│   ├── feed/         # RestaurantCard, ReviewCard, FeedFilter
│   ├── order/        # OrderCard, OrderStatusBadge, OrderItemRow
│   ├── restaurant/   # MenuSection, MenuItemCard
│   ├── profile/      # ProfileAvatar, ProfileStats
│   └── ui/           # Button, Input, Badge, Skeleton, EmptyState
├── features/
│   ├── auth/store.ts     # Zustand auth store
│   ├── orders/store.ts   # Zustand orders + draft store
│   └── feed/store.ts     # Zustand feed + filter store
├── hooks/
│   ├── useSupabaseAuth.ts    # Auth state sync
│   ├── useLocation.ts        # Expo Location wrapper
│   └── useNotifications.ts   # Push notification registration
├── services/
│   ├── supabase.ts   # Supabase client
│   ├── places.ts     # Google Places API
│   └── storage.ts    # Supabase Storage helpers
├── supabase/
│   └── migrations/   # SQL migrations
├── types/index.ts    # Shared TypeScript types
└── utils/index.ts    # Shared utilities
```

---

## 5-Step Order Creation Flow

| Step | Screen | Description |
|---|---|---|
| 1 | `step-1-restaurant` | Search and select a restaurant |
| 2 | `step-2-items` | Browse menu and add items to cart |
| 3 | `step-3-delivery` | Enter or detect delivery address |
| 4 | `step-4-review` | Review items, address, notes, and totals |
| 5 | `step-5-confirm` | Payment confirmation and order placement |

---

## EAS Build

```bash
# Development build (with dev client)
eas build --profile development --platform ios

# Preview build (internal distribution)
eas build --profile preview --platform all

# Production build (store submission)
eas build --profile production --platform all
```

---

## Database Schema

### Tables
- **profiles** — user accounts (auto-created on sign-up via trigger)
- **restaurants** — vendor restaurant listings
- **menu_categories** — grouped menu sections
- **menu_items** — individual dishes with prices in cents
- **orders** — customer orders with status tracking
- **order_items** — line items per order (price snapshot via trigger)
- **reviews** — post-delivery ratings (triggers avg rating update)
- **push_tokens** — Expo push tokens per device

### Key Triggers
- `on_auth_user_created` → auto-creates a profile row on sign-up
- `on_order_item_inserted` → snapshots `unit_price` and recomputes order totals
- `on_review_inserted` → recomputes restaurant `average_rating` and `total_reviews`

---

## Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |
| `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` | Google Places API key (for restaurant search) |
| `APP_ENV` | `development` / `preview` / `production` |
