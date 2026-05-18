-- ============================================================
-- Migration: saved_restaurants (bookmarks)
-- ============================================================

create table if not exists public.saved_restaurants (
  user_id       uuid not null references public.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

alter table public.saved_restaurants enable row level security;

create policy "Users can view their own saves"
  on public.saved_restaurants for select using (auth.uid() = user_id);

create policy "Users can manage their own saves"
  on public.saved_restaurants for all using (auth.uid() = user_id);

-- Index for fast reverse-lookup (how many saves a restaurant has)
create index if not exists saved_restaurants_restaurant_id_idx
  on public.saved_restaurants (restaurant_id);
