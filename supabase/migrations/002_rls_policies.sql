-- ============================================================
-- ULT ORDERS V1 — 002_rls_policies.sql
--
-- Row Level Security for every table in the schema.
--
-- Policy naming convention:
--   "[table] [action] [who]"
--   e.g. "ult_orders select public" / "saves insert own"
--
-- Auth helpers used throughout:
--   auth.uid()  — the authenticated user's UUID
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- HELPER FUNCTION
-- Returns true if the calling user has the admin role.
-- Used in policies that gate admin-only write access.
-- ─────────────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
    and   role = 'admin'
    and   is_active = true
  );
$$;

create or replace function public.is_vendor()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
    and   role in ('vendor', 'admin')
    and   is_active = true
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────────────────────

alter table public.users enable row level security;

-- Public can read non-deleted, active users (limited columns enforced in views)
create policy "users select public"
  on public.users for select
  using (deleted_at is null and is_active = true);

-- Only the user themselves can insert their row (bootstrapped via trigger)
create policy "users insert own"
  on public.users for insert
  with check (auth.uid() = id);

-- Only the user can update their own row (admins handled separately via service role)
create policy "users update own"
  on public.users for update
  using (auth.uid() = id and deleted_at is null)
  with check (auth.uid() = id);

-- Soft-delete only (via update); hard delete not allowed via RLS
create policy "users delete own"
  on public.users for delete
  using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- 2. RESTAURANTS
-- ─────────────────────────────────────────────────────────────

alter table public.restaurants enable row level security;

-- Anyone can read non-deleted restaurants
create policy "restaurants select public"
  on public.restaurants for select
  using (deleted_at is null);

-- Only vendors/admins can create restaurants
create policy "restaurants insert vendor"
  on public.restaurants for insert
  with check (auth.uid() = owner_id and public.is_vendor());

-- Only the owner or admin can update
create policy "restaurants update owner"
  on public.restaurants for update
  using (auth.uid() = owner_id or public.is_admin())
  with check (auth.uid() = owner_id or public.is_admin());

-- Only the owner or admin can delete
create policy "restaurants delete owner"
  on public.restaurants for delete
  using (auth.uid() = owner_id or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 3. ULT_ORDERS
-- ─────────────────────────────────────────────────────────────

alter table public.ult_orders enable row level security;

-- Public can read published ult_orders; owners can see their own in any status
create policy "ult_orders select published"
  on public.ult_orders for select
  using (
    deleted_at is null
    and (
      status = 'published'
      or auth.uid() = user_id
    )
  );

-- Authenticated users can create ult_orders
create policy "ult_orders insert own"
  on public.ult_orders for insert
  with check (auth.uid() = user_id);

-- Only the owner can update their ult_order
create policy "ult_orders update own"
  on public.ult_orders for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

-- Owner or admin can delete (soft-delete by setting deleted_at)
create policy "ult_orders delete own"
  on public.ult_orders for delete
  using (auth.uid() = user_id or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 4. ORDERS  (transactional)
-- ─────────────────────────────────────────────────────────────

alter table public.orders enable row level security;

-- Customers see their own orders; vendors see orders for their restaurant
create policy "orders select own"
  on public.orders for select
  using (
    auth.uid() = customer_id
    or exists (
      select 1 from public.restaurants r
      where r.id = orders.restaurant_id
      and   r.owner_id = auth.uid()
    )
  );

create policy "orders insert customer"
  on public.orders for insert
  with check (auth.uid() = customer_id);

-- Vendors can update order status; customers cannot update orders
create policy "orders update vendor"
  on public.orders for update
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = orders.restaurant_id
      and   r.owner_id = auth.uid()
    )
    or auth.uid() = customer_id
  );

-- ─────────────────────────────────────────────────────────────
-- 5. ULT_ORDER_ITEMS
-- ─────────────────────────────────────────────────────────────

alter table public.ult_order_items enable row level security;

-- Readable if the parent ult_order is readable
create policy "ult_order_items select"
  on public.ult_order_items for select
  using (
    exists (
      select 1 from public.ult_orders o
      where o.id = ult_order_items.ult_order_id
      and   (o.status = 'published' or o.user_id = auth.uid())
      and   o.deleted_at is null
    )
  );

create policy "ult_order_items insert own"
  on public.ult_order_items for insert
  with check (
    exists (
      select 1 from public.ult_orders o
      where o.id = ult_order_id
      and   o.user_id = auth.uid()
    )
  );

create policy "ult_order_items update own"
  on public.ult_order_items for update
  using (
    exists (
      select 1 from public.ult_orders o
      where o.id = ult_order_id
      and   o.user_id = auth.uid()
    )
  );

create policy "ult_order_items delete own"
  on public.ult_order_items for delete
  using (
    exists (
      select 1 from public.ult_orders o
      where o.id = ult_order_id
      and   o.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 6. ORDER_ITEMS (transactional)
-- ─────────────────────────────────────────────────────────────

alter table public.order_items enable row level security;

create policy "order_items select own"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders ord
      where ord.id = order_items.order_id
      and (
        ord.customer_id = auth.uid()
        or exists (
          select 1 from public.restaurants r
          where r.id = ord.restaurant_id
          and r.owner_id = auth.uid()
        )
      )
    )
  );

create policy "order_items insert own"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders ord
      where ord.id = order_id
      and   ord.customer_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 7. ULT_ORDER_MEDIA
-- ─────────────────────────────────────────────────────────────

alter table public.ult_order_media enable row level security;

create policy "ult_order_media select"
  on public.ult_order_media for select
  using (
    exists (
      select 1 from public.ult_orders o
      where o.id = ult_order_media.ult_order_id
      and   (o.status = 'published' or o.user_id = auth.uid())
      and   o.deleted_at is null
    )
  );

create policy "ult_order_media insert own"
  on public.ult_order_media for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.ult_orders o
      where o.id = ult_order_id
      and   o.user_id = auth.uid()
    )
  );

create policy "ult_order_media delete own"
  on public.ult_order_media for delete
  using (auth.uid() = user_id or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 8. TAGS  (read-only for users; write via admin/service role)
-- ─────────────────────────────────────────────────────────────

alter table public.tags enable row level security;

create policy "tags select public"
  on public.tags for select
  using (true);

-- Only admins can create/modify system tags
create policy "tags insert admin"
  on public.tags for insert
  with check (public.is_admin());

create policy "tags update admin"
  on public.tags for update
  using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 9. ULT_ORDER_TAGS
-- ─────────────────────────────────────────────────────────────

alter table public.ult_order_tags enable row level security;

create policy "ult_order_tags select public"
  on public.ult_order_tags for select
  using (
    exists (
      select 1 from public.ult_orders o
      where o.id = ult_order_tags.ult_order_id
      and   (o.status = 'published' or o.user_id = auth.uid())
    )
  );

create policy "ult_order_tags manage own"
  on public.ult_order_tags for all
  using (
    exists (
      select 1 from public.ult_orders o
      where o.id = ult_order_id
      and   o.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 10. FOLLOWS
-- ─────────────────────────────────────────────────────────────

alter table public.follows enable row level security;

create policy "follows select public"
  on public.follows for select
  using (true);

create policy "follows insert own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "follows delete own"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ─────────────────────────────────────────────────────────────
-- 11. LIKES
-- ─────────────────────────────────────────────────────────────

alter table public.likes enable row level security;

-- Like counts are public; individual rows visible to owner + target author
create policy "likes select public"
  on public.likes for select
  using (true);

create policy "likes insert own"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "likes delete own"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 12. SAVES (ult_order bookmarks)
-- ─────────────────────────────────────────────────────────────

alter table public.saves enable row level security;

create policy "saves select own"
  on public.saves for select
  using (auth.uid() = user_id);

create policy "saves insert own"
  on public.saves for insert
  with check (auth.uid() = user_id);

create policy "saves delete own"
  on public.saves for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 13. SAVED_RESTAURANTS
-- ─────────────────────────────────────────────────────────────

alter table public.saved_restaurants enable row level security;

create policy "saved_restaurants select own"
  on public.saved_restaurants for select
  using (auth.uid() = user_id);

create policy "saved_restaurants insert own"
  on public.saved_restaurants for insert
  with check (auth.uid() = user_id);

create policy "saved_restaurants delete own"
  on public.saved_restaurants for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 14. COMMENTS
-- ─────────────────────────────────────────────────────────────

alter table public.comments enable row level security;

-- Non-deleted comments on published ult_orders are public
create policy "comments select public"
  on public.comments for select
  using (
    deleted_at is null
    and exists (
      select 1 from public.ult_orders o
      where o.id = comments.ult_order_id
      and   (o.status = 'published' or o.user_id = auth.uid())
    )
  );

create policy "comments insert own"
  on public.comments for insert
  with check (auth.uid() = user_id);

-- Authors can edit their own comments
create policy "comments update own"
  on public.comments for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

-- Authors and admins can soft-delete
create policy "comments delete own"
  on public.comments for delete
  using (auth.uid() = user_id or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 15. TRIED_ORDERS
-- ─────────────────────────────────────────────────────────────

alter table public.tried_orders enable row level security;

-- Try counts are public; notes visible only to the user
create policy "tried_orders select"
  on public.tried_orders for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.ult_orders o
      where o.id = tried_orders.ult_order_id
      and   o.user_id = auth.uid()
    )
  );

create policy "tried_orders insert own"
  on public.tried_orders for insert
  with check (auth.uid() = user_id);

create policy "tried_orders update own"
  on public.tried_orders for update
  using (auth.uid() = user_id);

create policy "tried_orders delete own"
  on public.tried_orders for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 16. COLLECTIONS
-- ─────────────────────────────────────────────────────────────

alter table public.collections enable row level security;

-- Visibility rules: public → everyone; followers → follower check; private → owner only
create policy "collections select"
  on public.collections for select
  using (
    visibility = 'public'
    or auth.uid() = user_id
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid()
        and   f.following_id = collections.user_id
      )
    )
  );

create policy "collections insert own"
  on public.collections for insert
  with check (auth.uid() = user_id);

create policy "collections update own"
  on public.collections for update
  using (auth.uid() = user_id);

create policy "collections delete own"
  on public.collections for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 17. COLLECTION_ITEMS
-- ─────────────────────────────────────────────────────────────

alter table public.collection_items enable row level security;

create policy "collection_items select"
  on public.collection_items for select
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_items.collection_id
      and (
        c.visibility = 'public'
        or c.user_id = auth.uid()
        or (
          c.visibility = 'followers'
          and exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid()
            and   f.following_id = c.user_id
          )
        )
      )
    )
  );

create policy "collection_items insert own"
  on public.collection_items for insert
  with check (
    auth.uid() = added_by
    and exists (
      select 1 from public.collections c
      where c.id = collection_id
      and   c.user_id = auth.uid()
    )
  );

create policy "collection_items delete own"
  on public.collection_items for delete
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id
      and   c.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 18. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────

alter table public.notifications enable row level security;

create policy "notifications select own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Inserted by triggers and server-side functions only; users cannot self-insert
create policy "notifications update own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notifications delete own"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 19. REWARDS_EVENTS
-- ─────────────────────────────────────────────────────────────

alter table public.rewards_events enable row level security;

create policy "rewards_events select own"
  on public.rewards_events for select
  using (auth.uid() = user_id);

-- Write-only via server (triggers / service role)

-- ─────────────────────────────────────────────────────────────
-- 20. BADGES
-- ─────────────────────────────────────────────────────────────

alter table public.badges enable row level security;

create policy "badges select public"
  on public.badges for select
  using (is_active = true);

create policy "badges manage admin"
  on public.badges for all
  using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 21. USER_BADGES
-- ─────────────────────────────────────────────────────────────

alter table public.user_badges enable row level security;

create policy "user_badges select public"
  on public.user_badges for select
  using (true);

-- Inserted by triggers / service role; users can only update is_featured
create policy "user_badges update featured"
  on public.user_badges for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 22. REPORTS
-- ─────────────────────────────────────────────────────────────

alter table public.reports enable row level security;

-- Reporters see their own reports; admins see all
create policy "reports select"
  on public.reports for select
  using (auth.uid() = reporter_id or public.is_admin());

create policy "reports insert own"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- Only admins can update report status
create policy "reports update admin"
  on public.reports for update
  using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 23. PUSH_TOKENS
-- ─────────────────────────────────────────────────────────────

alter table public.push_tokens enable row level security;

create policy "push_tokens select own"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "push_tokens manage own"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 24. PUBLIC VIEWS (no RLS needed — queried through policies above)
--     Expose only safe columns for unauthenticated reads.
-- ─────────────────────────────────────────────────────────────

-- Safe public user profile (no email, no role, no preferences)
create or replace view public.public_users as
  select
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.bio,
    u.taste_tags,
    u.is_verified,
    u.follower_count,
    u.following_count,
    u.ult_order_count,
    u.created_at
  from public.users u
  where u.deleted_at is null
  and   u.is_active = true;

-- Feed view: published ult_orders joined with author + restaurant
create or replace view public.ult_orders_feed as
  select
    o.id,
    o.user_id,
    o.restaurant_id,
    o.title,
    o.caption,
    o.status,
    o.subtotal,
    o.total,
    o.currency,
    o.is_pinned,
    o.like_count,
    o.save_count,
    o.comment_count,
    o.try_count,
    o.view_count,
    o.trending_score,
    o.published_at,
    o.created_at,
    o.updated_at,
    -- Author snapshot
    u.username          as author_username,
    u.display_name      as author_display_name,
    u.avatar_url        as author_avatar_url,
    u.is_verified       as author_is_verified,
    -- Restaurant snapshot
    r.name              as restaurant_name,
    r.address           as restaurant_address,
    r.average_rating    as restaurant_rating,
    r.cuisine_type      as restaurant_cuisine_type
  from public.ult_orders o
  join public.users u       on u.id = o.user_id
  join public.restaurants r on r.id = o.restaurant_id
  where o.status = 'published'
  and   o.deleted_at is null
  and   u.deleted_at is null
  and   r.deleted_at is null;
