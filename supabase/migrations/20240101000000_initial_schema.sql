-- ============================================================
-- ult-orders: Initial Schema Migration
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ─── PROFILES ────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  full_name   text,
  avatar_url  text,
  bio         text,
  role        text not null default 'customer' check (role in ('customer', 'vendor', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── RESTAURANTS ─────────────────────────────────────────────
create table public.restaurants (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  description     text,
  cover_image_url text,
  logo_url        text,
  address         text not null,
  latitude        double precision not null,
  longitude       double precision not null,
  phone           text,
  email           text,
  cuisine_type    text[] not null default '{}',
  status          text not null default 'closed' check (status in ('open', 'closed', 'busy')),
  average_rating  numeric(3,2) not null default 0,
  total_reviews   integer not null default 0,
  place_id        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.restaurants enable row level security;

create policy "Restaurants are viewable by everyone"
  on public.restaurants for select using (true);

create policy "Vendors can insert their own restaurants"
  on public.restaurants for insert with check (auth.uid() = owner_id);

create policy "Vendors can update their own restaurants"
  on public.restaurants for update using (auth.uid() = owner_id);

-- ─── MENU CATEGORIES ─────────────────────────────────────────
create table public.menu_categories (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null,
  description   text,
  sort_order    integer not null default 0
);

alter table public.menu_categories enable row level security;

create policy "Menu categories are viewable by everyone"
  on public.menu_categories for select using (true);

create policy "Vendors can manage their menu categories"
  on public.menu_categories for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = menu_categories.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- ─── MENU ITEMS ───────────────────────────────────────────────
create table public.menu_items (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id   uuid references public.menu_categories(id) on delete set null,
  name          text not null,
  description   text,
  price         integer not null, -- stored in cents
  image_url     text,
  is_available  boolean not null default true,
  is_featured   boolean not null default false,
  dietary_tags  text[] not null default '{}',
  sort_order    integer not null default 0
);

alter table public.menu_items enable row level security;

create policy "Menu items are viewable by everyone"
  on public.menu_items for select using (true);

create policy "Vendors can manage their menu items"
  on public.menu_items for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = menu_items.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- ─── ORDERS ───────────────────────────────────────────────────
create table public.orders (
  id                   uuid primary key default uuid_generate_v4(),
  customer_id          uuid not null references public.profiles(id),
  restaurant_id        uuid not null references public.restaurants(id),
  status               text not null default 'pending'
                         check (status in ('pending','confirmed','preparing','ready','picked_up','delivered','cancelled')),
  subtotal             integer not null default 0,
  delivery_fee         integer not null default 0,
  tax                  integer not null default 0,
  total                integer not null default 0,
  delivery_address     text not null,
  delivery_latitude    double precision,
  delivery_longitude   double precision,
  notes                text,
  scheduled_at         timestamptz,
  estimated_delivery_at timestamptz,
  delivered_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Customers can view their own orders"
  on public.orders for select using (auth.uid() = customer_id);

create policy "Vendors can view orders for their restaurants"
  on public.orders for select
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = orders.restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "Customers can insert orders"
  on public.orders for insert with check (auth.uid() = customer_id);

create policy "Vendors can update order status"
  on public.orders for update
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = orders.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- ─── ORDER ITEMS ──────────────────────────────────────────────
create table public.order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  quantity     integer not null check (quantity > 0),
  unit_price   integer not null default 0, -- snapshot of price at order time
  notes        text
);

alter table public.order_items enable row level security;

create policy "Order items visible to order owner and vendor"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid()
          or exists (
            select 1 from public.restaurants r
            where r.id = o.restaurant_id and r.owner_id = auth.uid()
          ))
    )
  );

create policy "Customers can insert order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );

-- Trigger: snapshot unit_price + recompute order totals on item insert
create or replace function public.handle_order_item_insert()
returns trigger as $$
declare
  v_price integer;
begin
  select price into v_price from public.menu_items where id = new.menu_item_id;
  new.unit_price := v_price;

  update public.orders
  set
    subtotal = (
      select coalesce(sum(quantity * unit_price), 0)
      from public.order_items
      where order_id = new.order_id
    ) + (new.quantity * v_price),
    updated_at = now()
  where id = new.order_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_order_item_inserted
  before insert on public.order_items
  for each row execute procedure public.handle_order_item_insert();

-- ─── REVIEWS ──────────────────────────────────────────────────
create table public.reviews (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null unique references public.orders(id),
  customer_id   uuid not null references public.profiles(id),
  restaurant_id uuid not null references public.restaurants(id),
  rating        numeric(2,1) not null check (rating >= 1 and rating <= 5),
  comment       text,
  image_urls    text[] not null default '{}',
  created_at    timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Customers can insert reviews for their orders"
  on public.reviews for insert
  with check (
    auth.uid() = customer_id and
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = auth.uid() and o.status = 'delivered'
    )
  );

-- Trigger: update restaurant average rating on review insert
create or replace function public.update_restaurant_rating()
returns trigger as $$
begin
  update public.restaurants
  set
    average_rating = (
      select round(avg(rating)::numeric, 2)
      from public.reviews
      where restaurant_id = new.restaurant_id
    ),
    total_reviews = (
      select count(*) from public.reviews where restaurant_id = new.restaurant_id
    )
  where id = new.restaurant_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_inserted
  after insert on public.reviews
  for each row execute procedure public.update_restaurant_rating();

-- ─── PUSH TOKENS ──────────────────────────────────────────────
create table public.push_tokens (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  token      text not null,
  platform   text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.push_tokens enable row level security;

create policy "Users can manage their own push tokens"
  on public.push_tokens for all using (auth.uid() = user_id);

-- ─── STORAGE BUCKETS (run via Supabase dashboard or CLI) ─────
-- supabase storage create avatars --public
-- supabase storage create restaurant-images --public
-- supabase storage create review-images --public
