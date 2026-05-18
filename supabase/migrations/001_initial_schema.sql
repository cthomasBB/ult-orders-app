-- ============================================================
-- ULT ORDERS V1 — 001_initial_schema.sql
--
-- Canonical schema for the ULT Orders platform.
-- Run order: 004_postgis → 001_initial_schema → 002_rls_policies → 003_triggers
--
-- Conventions:
--   • All PKs are uuid (uuid_generate_v4())
--   • All timestamps are timestamptz in UTC
--   • Monetary values stored as integer (cents)
--   • Soft-delete via deleted_at where relevant
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";
create extension if not exists "postgis";
create extension if not exists "pg_trgm";   -- fuzzy text search on names/tags

-- ─────────────────────────────────────────────────────────────
-- 1. USERS
--    Public-facing profile, distinct from auth.users.
--    Created by trigger on auth.users INSERT.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.users (
  id                  uuid        primary key references auth.users(id) on delete cascade,

  -- Identity
  username            text        not null unique
                                  constraint username_length   check (char_length(username) between 3 and 30)
                                  constraint username_chars    check (username ~ '^[a-z0-9_]+$'),
  display_name        text        constraint display_name_length check (char_length(display_name) <= 60),
  bio                 text        constraint bio_length         check (char_length(bio) <= 300),
  avatar_url          text,
  website_url         text,

  -- Role & status
  role                text        not null default 'customer'
                                  check (role in ('customer', 'vendor', 'admin')),
  is_verified         boolean     not null default false,
  is_suggested        boolean     not null default false,   -- shown in onboarding
  is_active           boolean     not null default true,

  -- Preferences set during onboarding
  taste_tags          text[]      not null default '{}',
  dietary_prefs       text[]      not null default '{}',
  notification_prefs  jsonb       not null default '{"push": true, "email": true}'::jsonb,

  -- Aggregate counters (maintained by triggers)
  follower_count      integer     not null default 0 check (follower_count >= 0),
  following_count     integer     not null default 0 check (following_count >= 0),
  ult_order_count     integer     not null default 0 check (ult_order_count >= 0),

  -- Timestamps
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- Indexes
create index if not exists users_username_idx       on public.users (username);
create index if not exists users_role_idx           on public.users (role);
create index if not exists users_is_suggested_idx   on public.users (is_suggested) where is_suggested = true;
create index if not exists users_taste_tags_idx     on public.users using gin (taste_tags);
create index if not exists users_username_trgm_idx  on public.users using gin (username gin_trgm_ops);

-- Auto-create user row on Supabase sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      -- sanitise email prefix as fallback username
      regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '_', 'g')
    ),
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. RESTAURANTS
--    Venues that appear on ULT Orders. Uses PostGIS for
--    geospatial queries (nearby search).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.restaurants (
  id                  uuid        primary key default uuid_generate_v4(),
  owner_id            uuid        not null references public.users(id) on delete restrict,

  -- Identity
  name                text        not null constraint restaurant_name_length check (char_length(name) between 1 and 120),
  slug                text        unique,  -- URL-friendly name, e.g. "joes-burgers-nyc"
  description         text        constraint restaurant_desc_length check (char_length(description) <= 1000),
  cuisine_type        text[]      not null default '{}',
  tags                text[]      not null default '{}',

  -- Media
  cover_image_url     text,
  logo_url            text,
  gallery_urls        text[]      not null default '{}',

  -- Contact & location
  address             text        not null,
  city                text,
  state               text,
  country             text        not null default 'US',
  postal_code         text,
  latitude            double precision not null,
  longitude           double precision not null,
  -- PostGIS point: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  location            geography(POINT, 4326)
                                  generated always as (
                                    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
                                  ) stored,
  phone               text,
  email               text,
  website_url         text,
  google_place_id     text,

  -- Operating status
  status              text        not null default 'closed'
                                  check (status in ('open', 'closed', 'busy', 'temporarily_closed', 'permanently_closed')),
  operating_hours     jsonb,      -- { "mon": ["09:00","22:00"], "tue": [...], ... }
  timezone            text        not null default 'America/New_York',

  -- Aggregate stats (maintained by triggers)
  average_rating      numeric(3, 2) not null default 0.00
                                  check (average_rating between 0 and 5),
  total_reviews       integer     not null default 0 check (total_reviews >= 0),
  ult_order_count     integer     not null default 0 check (ult_order_count >= 0),
  save_count          integer     not null default 0 check (save_count >= 0),

  -- Flags
  is_featured         boolean     not null default false,
  is_verified         boolean     not null default false,
  accepts_reservations boolean    not null default false,

  -- Timestamps
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- Indexes
create index if not exists restaurants_owner_id_idx     on public.restaurants (owner_id);
create index if not exists restaurants_status_idx       on public.restaurants (status);
create index if not exists restaurants_cuisine_idx      on public.restaurants using gin (cuisine_type);
create index if not exists restaurants_tags_idx         on public.restaurants using gin (tags);
create index if not exists restaurants_name_trgm_idx    on public.restaurants using gin (name gin_trgm_ops);
create index if not exists restaurants_featured_idx     on public.restaurants (is_featured) where is_featured = true;
-- PostGIS spatial index (also created in 004_postgis.sql)
create index if not exists restaurants_location_gist    on public.restaurants using gist (location);

-- ─────────────────────────────────────────────────────────────
-- 3. ULT_ORDERS
--    The core social object — a user's documented food order.
--    Think of it as a "post" that wraps an actual food order.
-- ─────────────────────────────────────────────────────────────

create type ult_order_status as enum (
  'draft',        -- being composed
  'published',    -- visible to everyone
  'unlisted',     -- visible only via direct link
  'archived',     -- hidden by user
  'removed'       -- removed by moderation
);

create table if not exists public.ult_orders (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references public.users(id) on delete cascade,
  restaurant_id       uuid        not null references public.restaurants(id) on delete restrict,

  -- Content
  title               text        constraint ult_order_title_length check (char_length(title) <= 140),
  caption             text        constraint ult_order_caption_length check (char_length(caption) <= 2200),
  status              ult_order_status not null default 'draft',

  -- The actual order details (mirrored/snapshotted from the live order)
  order_id            uuid        references public.orders(id) on delete set null,
  subtotal            integer     not null default 0 check (subtotal >= 0),  -- cents
  total               integer     not null default 0 check (total >= 0),     -- cents
  currency            char(3)     not null default 'USD',

  -- Full order snapshot for portability (used for "reorder" and sharing)
  order_export_json   jsonb       not null default '{}'::jsonb,
  -- Free-form metadata: dietary notes, occasion, ambience rating, etc.
  metadata            jsonb       not null default '{}'::jsonb,

  -- Pin mechanics (user can pin up to N ult_orders on their profile)
  is_pinned           boolean     not null default false,
  pin_order           smallint    check (pin_order between 1 and 6),

  -- Engagement counters (maintained by triggers)
  like_count          integer     not null default 0 check (like_count >= 0),
  save_count          integer     not null default 0 check (save_count >= 0),
  comment_count       integer     not null default 0 check (comment_count >= 0),
  try_count           integer     not null default 0 check (try_count >= 0),
  view_count          integer     not null default 0 check (view_count >= 0),
  share_count         integer     not null default 0 check (share_count >= 0),

  -- Algorithmic ranking score (recomputed by background job / trigger)
  -- Formula: likes*3 + saves*2 + tries*4 + comments*2 + views*0.1
  trending_score      numeric(12, 4) not null default 0,

  -- Timestamps
  published_at        timestamptz,  -- set when status transitions to 'published'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,

  -- Constraints
  constraint pin_order_requires_is_pinned check (pin_order is null or is_pinned = true),
  constraint published_at_set_when_published
    check (status <> 'published' or published_at is not null)
);

-- Indexes
create index if not exists ult_orders_user_id_idx         on public.ult_orders (user_id);
create index if not exists ult_orders_restaurant_id_idx   on public.ult_orders (restaurant_id);
create index if not exists ult_orders_status_idx          on public.ult_orders (status);
create index if not exists ult_orders_published_at_idx    on public.ult_orders (published_at desc) where status = 'published';
create index if not exists ult_orders_trending_idx        on public.ult_orders (trending_score desc) where status = 'published';
create index if not exists ult_orders_user_pinned_idx     on public.ult_orders (user_id, pin_order) where is_pinned = true;
create index if not exists ult_orders_order_export_idx    on public.ult_orders using gin (order_export_json);
create index if not exists ult_orders_metadata_idx        on public.ult_orders using gin (metadata);

-- ─────────────────────────────────────────────────────────────
-- 4. ORDERS  (transactional — the real food order)
--    Referenced from ult_orders.order_id as a snapshot source.
-- ─────────────────────────────────────────────────────────────

create type order_status as enum (
  'pending', 'confirmed', 'preparing', 'ready',
  'picked_up', 'delivered', 'cancelled'
);

create table if not exists public.orders (
  id                      uuid        primary key default uuid_generate_v4(),
  customer_id             uuid        not null references public.users(id) on delete restrict,
  restaurant_id           uuid        not null references public.restaurants(id) on delete restrict,

  status                  order_status not null default 'pending',

  -- Pricing (all cents)
  subtotal                integer     not null default 0 check (subtotal >= 0),
  delivery_fee            integer     not null default 0 check (delivery_fee >= 0),
  tax                     integer     not null default 0 check (tax >= 0),
  tip                     integer     not null default 0 check (tip >= 0),
  discount                integer     not null default 0 check (discount >= 0),
  total                   integer     not null default 0 check (total >= 0),
  currency                char(3)     not null default 'USD',

  -- Delivery
  delivery_address        text        not null,
  delivery_latitude       double precision,
  delivery_longitude      double precision,
  delivery_notes          text,

  -- Scheduling
  notes                   text,
  scheduled_at            timestamptz,
  estimated_delivery_at   timestamptz,
  delivered_at            timestamptz,

  -- Timestamps
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists orders_customer_id_idx    on public.orders (customer_id);
create index if not exists orders_restaurant_id_idx  on public.orders (restaurant_id);
create index if not exists orders_status_idx         on public.orders (status);
create index if not exists orders_created_at_idx     on public.orders (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- 5. ULT_ORDER_ITEMS
--    Line-items within an ult_order's order snapshot.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.ult_order_items (
  id                  uuid        primary key default uuid_generate_v4(),
  ult_order_id        uuid        not null references public.ult_orders(id) on delete cascade,
  order_id            uuid        references public.orders(id) on delete set null,

  -- Snapshotted item data (denormalised so the ult_order is self-contained)
  name                text        not null,
  description         text,
  quantity            smallint    not null default 1 check (quantity > 0),
  unit_price          integer     not null default 0 check (unit_price >= 0),  -- cents
  total_price         integer     generated always as (quantity * unit_price) stored,
  image_url           text,
  dietary_tags        text[]      not null default '{}',
  notes               text,
  sort_order          smallint    not null default 0,

  -- Reference to live menu item (nullable — item may be removed later)
  menu_item_id        uuid,

  created_at          timestamptz not null default now()
);

create index if not exists ult_order_items_ult_order_id_idx on public.ult_order_items (ult_order_id);
create index if not exists ult_order_items_order_id_idx     on public.ult_order_items (order_id);

-- ─────────────────────────────────────────────────────────────
-- 6. ORDER_ITEMS  (transactional)
--    Line-items for the real order object.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.order_items (
  id                  uuid        primary key default uuid_generate_v4(),
  order_id            uuid        not null references public.orders(id) on delete cascade,
  menu_item_id        uuid,       -- soft reference; item may be removed
  quantity            smallint    not null check (quantity > 0),
  unit_price          integer     not null default 0,  -- snapshotted cents
  notes               text,
  created_at          timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ─────────────────────────────────────────────────────────────
-- 7. ULT_ORDER_MEDIA
--    Photos / videos attached to an ult_order.
-- ─────────────────────────────────────────────────────────────

create type media_type as enum ('photo', 'video');

create table if not exists public.ult_order_media (
  id                  uuid        primary key default uuid_generate_v4(),
  ult_order_id        uuid        not null references public.ult_orders(id) on delete cascade,
  user_id             uuid        not null references public.users(id) on delete cascade,

  media_type          media_type  not null default 'photo',
  url                 text        not null,
  thumbnail_url       text,
  width               integer     check (width > 0),
  height              integer     check (height > 0),
  duration_seconds    numeric(6, 2),  -- for video
  file_size_bytes     integer,
  storage_path        text,       -- supabase storage object path

  alt_text            text        constraint alt_text_length check (char_length(alt_text) <= 200),
  sort_order          smallint    not null default 0,

  created_at          timestamptz not null default now()
);

create index if not exists ult_order_media_ult_order_id_idx on public.ult_order_media (ult_order_id, sort_order);
create index if not exists ult_order_media_user_id_idx      on public.ult_order_media (user_id);

-- ─────────────────────────────────────────────────────────────
-- 8. TAGS
--    Canonical tag vocabulary (food types, occasions, vibes).
--    Users tag ult_orders; queried for discovery.
-- ─────────────────────────────────────────────────────────────

create type tag_category as enum (
  'cuisine', 'dietary', 'vibe', 'occasion', 'price_range', 'custom'
);

create table if not exists public.tags (
  id                  uuid        primary key default uuid_generate_v4(),
  name                text        not null unique
                                  constraint tag_name_length check (char_length(name) between 1 and 50)
                                  constraint tag_name_chars  check (name ~ '^[a-z0-9_-]+$'),
  display_name        text        not null,
  category            tag_category not null default 'custom',
  description         text,
  emoji               text,
  is_system           boolean     not null default false,  -- created by platform, not users
  usage_count         integer     not null default 0 check (usage_count >= 0),

  created_at          timestamptz not null default now()
);

create index if not exists tags_category_idx    on public.tags (category);
create index if not exists tags_usage_idx       on public.tags (usage_count desc);
create index if not exists tags_name_trgm_idx   on public.tags using gin (name gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────
-- 9. ULT_ORDER_TAGS
--    Many-to-many join between ult_orders and tags.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.ult_order_tags (
  ult_order_id        uuid        not null references public.ult_orders(id) on delete cascade,
  tag_id              uuid        not null references public.tags(id) on delete cascade,
  created_at          timestamptz not null default now(),
  primary key (ult_order_id, tag_id)
);

create index if not exists ult_order_tags_tag_id_idx on public.ult_order_tags (tag_id);

-- ─────────────────────────────────────────────────────────────
-- 10. FOLLOWS
--     User-to-user follow graph.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.follows (
  follower_id         uuid        not null references public.users(id) on delete cascade,
  following_id        uuid        not null references public.users(id) on delete cascade,
  created_at          timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx on public.follows (following_id);
create index if not exists follows_created_at_idx   on public.follows (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- 11. LIKES
--     Users liking ult_orders.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.likes (
  user_id             uuid        not null references public.users(id) on delete cascade,
  ult_order_id        uuid        not null references public.ult_orders(id) on delete cascade,
  created_at          timestamptz not null default now(),
  primary key (user_id, ult_order_id)
);

create index if not exists likes_ult_order_id_idx on public.likes (ult_order_id);

-- ─────────────────────────────────────────────────────────────
-- 12. SAVES (bookmarks for ult_orders)
--     Distinct from saves on restaurants (saved_restaurants).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.saves (
  user_id             uuid        not null references public.users(id) on delete cascade,
  ult_order_id        uuid        not null references public.ult_orders(id) on delete cascade,
  created_at          timestamptz not null default now(),
  primary key (user_id, ult_order_id)
);

create index if not exists saves_ult_order_id_idx on public.saves (ult_order_id);

-- ─────────────────────────────────────────────────────────────
-- 13. SAVED_RESTAURANTS (restaurant bookmarks)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.saved_restaurants (
  user_id             uuid        not null references public.users(id) on delete cascade,
  restaurant_id       uuid        not null references public.restaurants(id) on delete cascade,
  created_at          timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

create index if not exists saved_restaurants_restaurant_id_idx on public.saved_restaurants (restaurant_id);

-- ─────────────────────────────────────────────────────────────
-- 14. COMMENTS
-- ─────────────────────────────────────────────────────────────

create table if not exists public.comments (
  id                  uuid        primary key default uuid_generate_v4(),
  ult_order_id        uuid        not null references public.ult_orders(id) on delete cascade,
  user_id             uuid        not null references public.users(id) on delete cascade,
  parent_id           uuid        references public.comments(id) on delete cascade,  -- thread replies

  body                text        not null
                                  constraint comment_body_length check (char_length(body) between 1 and 1000),
  is_edited           boolean     not null default false,
  like_count          integer     not null default 0 check (like_count >= 0),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index if not exists comments_ult_order_id_idx on public.comments (ult_order_id, created_at);
create index if not exists comments_user_id_idx      on public.comments (user_id);
create index if not exists comments_parent_id_idx    on public.comments (parent_id) where parent_id is not null;

-- ─────────────────────────────────────────────────────────────
-- 15. TRIED_ORDERS
--     Users marking an ult_order as "tried" (I ordered this too).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.tried_orders (
  user_id             uuid        not null references public.users(id) on delete cascade,
  ult_order_id        uuid        not null references public.ult_orders(id) on delete cascade,
  rating              smallint    check (rating between 1 and 5),
  note                text        constraint tried_note_length check (char_length(note) <= 300),
  created_at          timestamptz not null default now(),
  primary key (user_id, ult_order_id)
);

create index if not exists tried_orders_ult_order_id_idx on public.tried_orders (ult_order_id);

-- ─────────────────────────────────────────────────────────────
-- 16. COLLECTIONS
--     User-curated lists of ult_orders (like playlists).
-- ─────────────────────────────────────────────────────────────

create type collection_visibility as enum ('public', 'followers', 'private');

create table if not exists public.collections (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references public.users(id) on delete cascade,

  name                text        not null
                                  constraint collection_name_length check (char_length(name) between 1 and 80),
  description         text        constraint collection_desc_length  check (char_length(description) <= 300),
  cover_image_url     text,
  visibility          collection_visibility not null default 'public',
  is_pinned           boolean     not null default false,
  item_count          integer     not null default 0 check (item_count >= 0),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists collections_user_id_idx      on public.collections (user_id);
create index if not exists collections_visibility_idx   on public.collections (visibility);
create index if not exists collections_pinned_idx       on public.collections (user_id, is_pinned) where is_pinned = true;

-- ─────────────────────────────────────────────────────────────
-- 17. COLLECTION_ITEMS
-- ─────────────────────────────────────────────────────────────

create table if not exists public.collection_items (
  id                  uuid        primary key default uuid_generate_v4(),
  collection_id       uuid        not null references public.collections(id) on delete cascade,
  ult_order_id        uuid        not null references public.ult_orders(id) on delete cascade,
  added_by            uuid        not null references public.users(id) on delete cascade,
  note                text        constraint collection_item_note_length check (char_length(note) <= 200),
  sort_order          integer     not null default 0,
  created_at          timestamptz not null default now(),
  unique (collection_id, ult_order_id)
);

create index if not exists collection_items_collection_id_idx on public.collection_items (collection_id, sort_order);
create index if not exists collection_items_ult_order_id_idx  on public.collection_items (ult_order_id);

-- ─────────────────────────────────────────────────────────────
-- 18. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────

create type notification_type as enum (
  -- Order status
  'order_confirmed', 'order_preparing', 'order_ready',
  'order_picked_up', 'order_delivered', 'order_cancelled',
  -- Social
  'new_follower', 'ult_order_liked', 'ult_order_saved',
  'ult_order_tried', 'new_comment', 'comment_reply',
  'comment_liked', 'ult_order_featured',
  -- Rewards
  'badge_earned', 'reward_redeemed',
  -- Platform
  'system_message', 'promo'
);

create table if not exists public.notifications (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references public.users(id) on delete cascade,
  actor_id            uuid        references public.users(id) on delete set null,  -- who triggered it

  type                notification_type not null,
  title               text        not null constraint notif_title_length check (char_length(title) <= 100),
  body                text        constraint notif_body_length  check (char_length(body) <= 300),

  -- Deep-link targets (all nullable; populate whichever is relevant)
  ult_order_id        uuid        references public.ult_orders(id) on delete cascade,
  restaurant_id       uuid        references public.restaurants(id) on delete cascade,
  comment_id          uuid        references public.comments(id) on delete cascade,
  order_id            uuid        references public.orders(id) on delete cascade,

  -- Free-form payload for push notification routing
  data                jsonb       not null default '{}'::jsonb,

  is_read             boolean     not null default false,
  read_at             timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists notifications_user_id_idx     on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx      on public.notifications (user_id) where is_read = false;
create index if not exists notifications_type_idx        on public.notifications (type);

-- ─────────────────────────────────────────────────────────────
-- 19. REWARDS_EVENTS
--     Append-only ledger of points earned / spent.
-- ─────────────────────────────────────────────────────────────

create type reward_event_type as enum (
  'earn_signup',
  'earn_first_ult_order',
  'earn_ult_order_published',
  'earn_ult_order_liked',
  'earn_ult_order_tried',
  'earn_referral',
  'earn_streak',
  'spend_redemption',
  'adjust_admin'
);

create table if not exists public.rewards_events (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references public.users(id) on delete cascade,

  event_type          reward_event_type not null,
  points              integer     not null,  -- positive = earn, negative = spend
  balance_after       integer     not null,  -- running balance snapshot
  description         text,
  reference_id        uuid,       -- ult_order_id, order_id, etc. depending on type
  metadata            jsonb       not null default '{}'::jsonb,

  created_at          timestamptz not null default now()
);

create index if not exists rewards_events_user_id_idx on public.rewards_events (user_id, created_at desc);
create index if not exists rewards_events_type_idx    on public.rewards_events (event_type);

-- ─────────────────────────────────────────────────────────────
-- 20. BADGES
--     Platform achievement definitions.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.badges (
  id                  uuid        primary key default uuid_generate_v4(),
  slug                text        not null unique
                                  constraint badge_slug_chars check (slug ~ '^[a-z0-9_]+$'),
  name                text        not null,
  description         text        not null,
  icon_url            text,
  category            text        not null default 'general'
                                  check (category in ('general', 'social', 'foodie', 'streak', 'special')),
  points_reward       integer     not null default 0 check (points_reward >= 0),
  is_active           boolean     not null default true,
  sort_order          integer     not null default 0,
  created_at          timestamptz not null default now()
);

-- Seed core badges
insert into public.badges (slug, name, description, category, points_reward, sort_order) values
  ('first_ult_order',   'First ULT',        'Published your first ULT order',               'general', 50,  1),
  ('taste_explorer',    'Taste Explorer',   'Tried 5 different cuisines',                   'foodie',  100, 2),
  ('trendsetter',       'Trendsetter',      'Had an ult_order reach 100 likes',             'social',  200, 3),
  ('week_streak',       '7-Day Streak',     'Posted 7 days in a row',                       'streak',  150, 4),
  ('social_butterfly',  'Social Butterfly', 'Reached 50 followers',                         'social',  100, 5),
  ('food_critic',       'Food Critic',      'Left 20 reviews',                              'foodie',  150, 6),
  ('tried_it',          'Tried It!',        'Tried 10 orders from other users',             'social',  100, 7),
  ('collector',         'Collector',        'Created 3 public collections',                 'general', 75,  8),
  ('og',                'OG',               'One of the first 1000 users',                  'special', 500, 9)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 21. USER_BADGES
-- ─────────────────────────────────────────────────────────────

create table if not exists public.user_badges (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references public.users(id) on delete cascade,
  badge_id            uuid        not null references public.badges(id) on delete cascade,
  awarded_at          timestamptz not null default now(),
  is_featured         boolean     not null default false,  -- shown on profile
  unique (user_id, badge_id)
);

create index if not exists user_badges_user_id_idx   on public.user_badges (user_id);
create index if not exists user_badges_badge_id_idx  on public.user_badges (badge_id);
create index if not exists user_badges_featured_idx  on public.user_badges (user_id) where is_featured = true;

-- ─────────────────────────────────────────────────────────────
-- 22. REPORTS
--     User-submitted content reports for moderation.
-- ─────────────────────────────────────────────────────────────

create type report_reason as enum (
  'spam', 'harassment', 'hate_speech', 'misinformation',
  'inappropriate_content', 'copyright', 'other'
);

create type report_status as enum (
  'pending', 'under_review', 'resolved_removed',
  'resolved_kept', 'resolved_warned', 'dismissed'
);

create type report_target_type as enum (
  'ult_order', 'comment', 'user', 'restaurant'
);

create table if not exists public.reports (
  id                  uuid        primary key default uuid_generate_v4(),
  reporter_id         uuid        not null references public.users(id) on delete cascade,
  reviewed_by         uuid        references public.users(id) on delete set null,

  target_type         report_target_type not null,
  target_id           uuid        not null,
  reason              report_reason      not null,
  description         text        constraint report_desc_length check (char_length(description) <= 500),

  status              report_status not null default 'pending',
  resolution_note     text,

  created_at          timestamptz not null default now(),
  reviewed_at         timestamptz,

  -- Prevent duplicate reports on the same target by the same user
  unique (reporter_id, target_type, target_id)
);

create index if not exists reports_target_idx      on public.reports (target_type, target_id);
create index if not exists reports_status_idx      on public.reports (status) where status = 'pending';
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);

-- ─────────────────────────────────────────────────────────────
-- 23. PUSH_TOKENS
-- ─────────────────────────────────────────────────────────────

create table if not exists public.push_tokens (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references public.users(id) on delete cascade,
  token               text        not null,
  platform            text        not null check (platform in ('ios', 'android', 'web')),
  is_active           boolean     not null default true,
  created_at          timestamptz not null default now(),
  unique (user_id, token)
);

create index if not exists push_tokens_user_id_idx on public.push_tokens (user_id) where is_active = true;

-- ─────────────────────────────────────────────────────────────
-- 24. SHARED UTILITY: updated_at auto-update function
-- ─────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to all tables that have the column
do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'restaurants', 'ult_orders', 'orders',
    'comments', 'collections'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at
         before update on public.%I
         for each row execute procedure public.set_updated_at();',
      t, t
    );
  end loop;
end;
$$;
