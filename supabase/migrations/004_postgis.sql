-- ============================================================
-- ULT ORDERS V1 — 004_postgis.sql
--
-- PostGIS setup: extension, GIST indexes, and geo query helpers.
--
-- Run this FIRST (before 001_initial_schema.sql) because the
-- restaurants table references the geography type.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ENABLE EXTENSION
-- ─────────────────────────────────────────────────────────────

create extension if not exists "postgis";

-- Verify PostGIS is available (raises an error if not)
do $$
begin
  if not exists (
    select 1 from pg_extension where extname = 'postgis'
  ) then
    raise exception 'PostGIS extension could not be enabled. '
      'Please enable it in your Supabase project: '
      'Database → Extensions → postgis';
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. SPATIAL INDEXES
--    GIST indexes on geography columns for fast KNN / radius queries.
-- ─────────────────────────────────────────────────────────────

-- restaurants.location (primary spatial index)
create index if not exists restaurants_location_gist
  on public.restaurants
  using gist (location);

-- Partial index: only open restaurants (most common near-me query)
create index if not exists restaurants_open_location_gist
  on public.restaurants
  using gist (location)
  where status = 'open' and deleted_at is null;

-- ─────────────────────────────────────────────────────────────
-- 3. GEO HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────

-- 3a. Restaurants within a radius (metres) of a point.
--     Returns rows ordered by distance ascending.
--     Usage:
--       select * from public.restaurants_within_radius(40.7128, -74.0060, 2000);
create or replace function public.restaurants_within_radius(
  p_latitude   double precision,
  p_longitude  double precision,
  p_radius_m   double precision default 5000.0,  -- metres, default 5 km
  p_status     text default 'open',
  p_limit      integer default 30
)
returns table (
  id               uuid,
  name             text,
  slug             text,
  address          text,
  city             text,
  latitude         double precision,
  longitude        double precision,
  cuisine_type     text[],
  status           text,
  average_rating   numeric,
  total_reviews    integer,
  ult_order_count  integer,
  cover_image_url  text,
  distance_m       double precision
)
language sql
stable
security definer
as $$
  select
    r.id,
    r.name,
    r.slug,
    r.address,
    r.city,
    r.latitude,
    r.longitude,
    r.cuisine_type,
    r.status,
    r.average_rating,
    r.total_reviews,
    r.ult_order_count,
    r.cover_image_url,
    ST_Distance(
      r.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    ) as distance_m
  from public.restaurants r
  where
    r.deleted_at is null
    and (p_status is null or r.status = p_status)
    and ST_DWithin(
      r.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_radius_m
    )
  order by distance_m asc
  limit p_limit;
$$;

-- 3b. K-Nearest restaurants to a point (no radius bound).
--     Usage:
--       select * from public.nearest_restaurants(40.7128, -74.0060, 10);
create or replace function public.nearest_restaurants(
  p_latitude   double precision,
  p_longitude  double precision,
  p_k          integer default 10
)
returns table (
  id               uuid,
  name             text,
  address          text,
  latitude         double precision,
  longitude        double precision,
  cuisine_type     text[],
  status           text,
  average_rating   numeric,
  cover_image_url  text,
  distance_m       double precision
)
language sql
stable
security definer
as $$
  select
    r.id,
    r.name,
    r.address,
    r.latitude,
    r.longitude,
    r.cuisine_type,
    r.status,
    r.average_rating,
    r.cover_image_url,
    r.location <-> ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
      as distance_m
  from public.restaurants r
  where r.deleted_at is null
  and   r.status not in ('permanently_closed')
  order by
    r.location <-> ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
  limit p_k;
$$;

-- 3c. ULT orders near a location (via their restaurant's coordinates).
--     Useful for a "what people are ordering near me" feed.
--     Usage:
--       select * from public.ult_orders_near(40.7128, -74.0060, 3000);
create or replace function public.ult_orders_near(
  p_latitude   double precision,
  p_longitude  double precision,
  p_radius_m   double precision default 3000.0,
  p_limit      integer default 20
)
returns table (
  ult_order_id         uuid,
  user_id              uuid,
  restaurant_id        uuid,
  restaurant_name      text,
  title                text,
  like_count           integer,
  save_count           integer,
  try_count            integer,
  comment_count        integer,
  trending_score       numeric,
  published_at         timestamptz,
  distance_m           double precision
)
language sql
stable
security definer
as $$
  select
    o.id              as ult_order_id,
    o.user_id,
    o.restaurant_id,
    r.name            as restaurant_name,
    o.title,
    o.like_count,
    o.save_count,
    o.try_count,
    o.comment_count,
    o.trending_score,
    o.published_at,
    ST_Distance(
      r.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    ) as distance_m
  from public.ult_orders o
  join public.restaurants r on r.id = o.restaurant_id
  where
    o.status = 'published'
    and o.deleted_at is null
    and r.deleted_at is null
    and ST_DWithin(
      r.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_radius_m
    )
  order by o.trending_score desc, distance_m asc
  limit p_limit;
$$;

-- 3d. Bounding box query for map view.
--     Returns restaurants within a lat/lng bounding box
--     (efficient for map viewport queries).
--     Usage:
--       select * from public.restaurants_in_bbox(40.70, -74.02, 40.73, -73.97);
create or replace function public.restaurants_in_bbox(
  p_min_lat    double precision,
  p_min_lng    double precision,
  p_max_lat    double precision,
  p_max_lng    double precision,
  p_limit      integer default 100
)
returns table (
  id               uuid,
  name             text,
  latitude         double precision,
  longitude        double precision,
  cuisine_type     text[],
  status           text,
  average_rating   numeric,
  ult_order_count  integer,
  cover_image_url  text
)
language sql
stable
security definer
as $$
  select
    r.id,
    r.name,
    r.latitude,
    r.longitude,
    r.cuisine_type,
    r.status,
    r.average_rating,
    r.ult_order_count,
    r.cover_image_url
  from public.restaurants r
  where
    r.deleted_at is null
    and r.latitude  between p_min_lat and p_max_lat
    and r.longitude between p_min_lng and p_max_lng
  order by r.average_rating desc
  limit p_limit;
$$;

-- 3e. Distance between two lat/lng points in metres (pure-SQL utility).
create or replace function public.geo_distance_m(
  p_lat1 double precision, p_lng1 double precision,
  p_lat2 double precision, p_lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select ST_Distance(
    ST_SetSRID(ST_MakePoint(p_lng1, p_lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(p_lng2, p_lat2), 4326)::geography
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. GENERATED COLUMN BACKFILL
--    The restaurants.location generated column is declared in
--    001_initial_schema.sql. If this migration runs after rows
--    already exist (unlikely in fresh setup, but safe to handle),
--    PostgreSQL will recompute generated columns automatically on
--    the next update. No explicit backfill needed.
-- ─────────────────────────────────────────────────────────────

-- 4a. Verify the GIST index was created successfully
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where tablename = 'restaurants'
    and   indexname = 'restaurants_location_gist'
  ) then
    raise warning 'GIST index on restaurants.location was not created. '
      'Ensure PostGIS is enabled and run: '
      'CREATE INDEX restaurants_location_gist ON public.restaurants USING gist (location);';
  else
    raise notice 'PostGIS setup complete. Spatial indexes verified.';
  end if;
end;
$$;
