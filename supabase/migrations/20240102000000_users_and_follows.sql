-- ============================================================
-- Migration: public.users table for auth onboarding
-- Run after the initial schema migration.
-- ============================================================

-- ─── public.users ─────────────────────────────────────────────────────────────
-- This is distinct from auth.users (managed by Supabase).
-- Stores public-facing profile data set during onboarding.

create table if not exists public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  taste_tags   text[]      not null default '{}',
  -- follows are stored in a separate join table (see below)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- RLS
alter table public.users enable row level security;

create policy "Public users are viewable by everyone"
  on public.users for select using (true);

create policy "Users can insert their own row"
  on public.users for insert with check (auth.uid() = id);

create policy "Users can update their own row"
  on public.users for update using (auth.uid() = id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- ─── public.follows ───────────────────────────────────────────────────────────

create table if not exists public.follows (
  follower_id  uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  -- Can't follow yourself
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.follows for select using (true);

create policy "Users can manage their own follows"
  on public.follows for all using (auth.uid() = follower_id);

-- ─── Seed: suggested users for onboarding ────────────────────────────────────
-- These are illustrative; replace with real user IDs in production.
-- The onboarding follow-suggestions screen uses hardcoded data for now.
-- In production, query public.users WHERE is_suggested = true.

-- Add a flag for suggested users
alter table public.users
  add column if not exists is_suggested boolean not null default false;
