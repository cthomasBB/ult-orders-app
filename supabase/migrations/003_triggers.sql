-- ============================================================
-- ULT ORDERS V1 — 003_triggers.sql
--
-- All database triggers and their backing functions.
--
-- Trigger categories:
--   A. Counter maintenance  (likes, saves, comments, tries, follows)
--   B. Restaurant counters  (ult_order_count)
--   C. Trending score       (recomputed on each engagement change)
--   D. Order snapshotting   (unit_price, totals)
--   E. Notification fanout  (in-database push)
--   F. Collection item count
--   G. Published_at stamp
--   H. Tag usage tracking
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- UTILITY: generic counter delta function
-- ─────────────────────────────────────────────────────────────

create or replace function public.delta_counter(
  p_table   text,
  p_column  text,
  p_id_col  text,
  p_id      uuid,
  p_delta   integer       -- +1 or -1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute format(
    'update public.%I set %I = greatest(0, %I + $1) where %I = $2',
    p_table, p_column, p_column, p_id_col
  ) using p_delta, p_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- A1. LIKES → ult_orders.like_count
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_likes_counter()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.delta_counter('ult_orders', 'like_count', 'id', new.ult_order_id, +1);
  elsif (tg_op = 'DELETE') then
    perform public.delta_counter('ult_orders', 'like_count', 'id', old.ult_order_id, -1);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_likes_counter on public.likes;
create trigger trg_likes_counter
  after insert or delete on public.likes
  for each row execute procedure public.fn_likes_counter();

-- ─────────────────────────────────────────────────────────────
-- A2. SAVES → ult_orders.save_count
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_saves_counter()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.delta_counter('ult_orders', 'save_count', 'id', new.ult_order_id, +1);
  elsif (tg_op = 'DELETE') then
    perform public.delta_counter('ult_orders', 'save_count', 'id', old.ult_order_id, -1);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_saves_counter on public.saves;
create trigger trg_saves_counter
  after insert or delete on public.saves
  for each row execute procedure public.fn_saves_counter();

-- ─────────────────────────────────────────────────────────────
-- A3. SAVES (restaurants) → restaurants.save_count
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_saved_restaurants_counter()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.delta_counter('restaurants', 'save_count', 'id', new.restaurant_id, +1);
  elsif (tg_op = 'DELETE') then
    perform public.delta_counter('restaurants', 'save_count', 'id', old.restaurant_id, -1);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_saved_restaurants_counter on public.saved_restaurants;
create trigger trg_saved_restaurants_counter
  after insert or delete on public.saved_restaurants
  for each row execute procedure public.fn_saved_restaurants_counter();

-- ─────────────────────────────────────────────────────────────
-- A4. COMMENTS → ult_orders.comment_count
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_comments_counter()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.delta_counter('ult_orders', 'comment_count', 'id', new.ult_order_id, +1);
  elsif (tg_op = 'DELETE' or (tg_op = 'UPDATE' and new.deleted_at is not null and old.deleted_at is null)) then
    -- Decrement on hard delete OR when deleted_at is first set (soft delete)
    perform public.delta_counter('ult_orders', 'comment_count', 'id',
      case tg_op when 'DELETE' then old.ult_order_id else new.ult_order_id end, -1);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_comments_counter on public.comments;
create trigger trg_comments_counter
  after insert or delete or update of deleted_at on public.comments
  for each row execute procedure public.fn_comments_counter();

-- ─────────────────────────────────────────────────────────────
-- A5. TRIED_ORDERS → ult_orders.try_count
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_tried_orders_counter()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.delta_counter('ult_orders', 'try_count', 'id', new.ult_order_id, +1);
  elsif (tg_op = 'DELETE') then
    perform public.delta_counter('ult_orders', 'try_count', 'id', old.ult_order_id, -1);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_tried_orders_counter on public.tried_orders;
create trigger trg_tried_orders_counter
  after insert or delete on public.tried_orders
  for each row execute procedure public.fn_tried_orders_counter();

-- ─────────────────────────────────────────────────────────────
-- A6. FOLLOWS → users.follower_count + users.following_count
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_follows_counter()
returns trigger
language plpgsql
security definer
as $$
declare
  v_delta integer;
  v_follower_id uuid;
  v_following_id uuid;
begin
  if (tg_op = 'INSERT') then
    v_delta        := +1;
    v_follower_id  := new.follower_id;
    v_following_id := new.following_id;
  else
    v_delta        := -1;
    v_follower_id  := old.follower_id;
    v_following_id := old.following_id;
  end if;

  -- The person doing the following gains +1 following_count
  perform public.delta_counter('users', 'following_count', 'id', v_follower_id, v_delta);
  -- The person being followed gains +1 follower_count
  perform public.delta_counter('users', 'follower_count', 'id', v_following_id, v_delta);

  return null;
end;
$$;

drop trigger if exists trg_follows_counter on public.follows;
create trigger trg_follows_counter
  after insert or delete on public.follows
  for each row execute procedure public.fn_follows_counter();

-- ─────────────────────────────────────────────────────────────
-- B. RESTAURANTS.ult_order_count
--    Increment when an ult_order referencing this restaurant
--    is published; decrement on removal/archive.
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_restaurant_ult_order_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    -- Only count when inserted in published state (rare but possible)
    if new.status = 'published' then
      perform public.delta_counter('restaurants', 'ult_order_count', 'id', new.restaurant_id, +1);
    end if;

  elsif (tg_op = 'UPDATE') then
    -- Transition: draft/unlisted → published
    if old.status <> 'published' and new.status = 'published' then
      perform public.delta_counter('restaurants', 'ult_order_count', 'id', new.restaurant_id, +1);
    -- Transition: published → removed/archived
    elsif old.status = 'published' and new.status in ('removed', 'archived') then
      perform public.delta_counter('restaurants', 'ult_order_count', 'id', new.restaurant_id, -1);
    end if;

  elsif (tg_op = 'DELETE') then
    if old.status = 'published' then
      perform public.delta_counter('restaurants', 'ult_order_count', 'id', old.restaurant_id, -1);
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_restaurant_ult_order_count on public.ult_orders;
create trigger trg_restaurant_ult_order_count
  after insert or update of status or delete on public.ult_orders
  for each row execute procedure public.fn_restaurant_ult_order_count();

-- ─────────────────────────────────────────────────────────────
-- B2. USERS.ult_order_count (mirror on user profile)
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_user_ult_order_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    if new.status = 'published' then
      perform public.delta_counter('users', 'ult_order_count', 'id', new.user_id, +1);
    end if;
  elsif (tg_op = 'UPDATE') then
    if old.status <> 'published' and new.status = 'published' then
      perform public.delta_counter('users', 'ult_order_count', 'id', new.user_id, +1);
    elsif old.status = 'published' and new.status in ('removed', 'archived') then
      perform public.delta_counter('users', 'ult_order_count', 'id', new.user_id, -1);
    end if;
  elsif (tg_op = 'DELETE') then
    if old.status = 'published' then
      perform public.delta_counter('users', 'ult_order_count', 'id', old.user_id, -1);
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_user_ult_order_count on public.ult_orders;
create trigger trg_user_ult_order_count
  after insert or update of status or delete on public.ult_orders
  for each row execute procedure public.fn_user_ult_order_count();

-- ─────────────────────────────────────────────────────────────
-- C. TRENDING SCORE
--    Recomputed whenever any engagement counter changes.
--    Formula: likes*3 + saves*2 + tries*4 + comments*2 + views*0.1
--    With time decay: divided by (hours_since_publish + 2)^1.5
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_recompute_trending_score(p_ult_order_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_hours_age numeric;
begin
  update public.ult_orders
  set trending_score = (
    like_count    * 3.0
    + save_count  * 2.0
    + try_count   * 4.0
    + comment_count * 2.0
    + view_count  * 0.1
  ) / power(
    greatest(
      extract(epoch from (now() - coalesce(published_at, created_at))) / 3600.0,
      0
    ) + 2.0,
    1.5
  )
  where id = p_ult_order_id;
end;
$$;

-- Trigger function that calls the recompute for the affected row
create or replace function public.fn_update_trending_score()
returns trigger
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  -- Determine which ult_order_id to recompute
  v_id := coalesce(
    case tg_op when 'DELETE' then old.ult_order_id else new.ult_order_id end,
    null
  );
  if v_id is not null then
    perform public.fn_recompute_trending_score(v_id);
  end if;
  return null;
end;
$$;

-- Attach to all engagement tables
drop trigger if exists trg_trending_on_likes    on public.likes;
drop trigger if exists trg_trending_on_saves    on public.saves;
drop trigger if exists trg_trending_on_comments on public.comments;
drop trigger if exists trg_trending_on_tried    on public.tried_orders;

create trigger trg_trending_on_likes
  after insert or delete on public.likes
  for each row execute procedure public.fn_update_trending_score();

create trigger trg_trending_on_saves
  after insert or delete on public.saves
  for each row execute procedure public.fn_update_trending_score();

create trigger trg_trending_on_comments
  after insert or delete on public.comments
  for each row execute procedure public.fn_update_trending_score();

create trigger trg_trending_on_tried
  after insert or delete on public.tried_orders
  for each row execute procedure public.fn_update_trending_score();

-- ─────────────────────────────────────────────────────────────
-- D. ORDER SNAPSHOTTING
--    When an order_item is inserted, snapshot unit_price from
--    menu_items and recompute the order total.
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_snapshot_order_item_price()
returns trigger
language plpgsql
security definer
as $$
declare
  v_menu_price integer;
begin
  -- Fetch the live menu price if menu_item_id is provided and price not set
  if new.menu_item_id is not null and new.unit_price = 0 then
    select price into v_menu_price
    from public.menu_items
    where id = new.menu_item_id;

    new.unit_price := coalesce(v_menu_price, 0);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_snapshot_order_item_price on public.order_items;
create trigger trg_snapshot_order_item_price
  before insert on public.order_items
  for each row execute procedure public.fn_snapshot_order_item_price();

-- Recompute order subtotal after any item change
create or replace function public.fn_recompute_order_totals()
returns trigger
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_subtotal integer;
begin
  v_order_id := coalesce(
    case tg_op when 'DELETE' then old.order_id else new.order_id end,
    null
  );

  if v_order_id is null then return null; end if;

  select coalesce(sum(quantity * unit_price), 0)
  into   v_subtotal
  from   public.order_items
  where  order_id = v_order_id;

  update public.orders
  set    subtotal = v_subtotal,
         total    = v_subtotal + delivery_fee + tax + tip - discount
  where  id = v_order_id;

  return null;
end;
$$;

drop trigger if exists trg_recompute_order_totals on public.order_items;
create trigger trg_recompute_order_totals
  after insert or update or delete on public.order_items
  for each row execute procedure public.fn_recompute_order_totals();

-- ─────────────────────────────────────────────────────────────
-- E. NOTIFICATION FANOUT
--    Insert notification rows when social actions occur.
-- ─────────────────────────────────────────────────────────────

-- Helper: create a notification row (skips if actor == target)
create or replace function public.create_notification(
  p_user_id        uuid,
  p_actor_id       uuid,
  p_type           notification_type,
  p_title          text,
  p_body           text default null,
  p_ult_order_id   uuid default null,
  p_comment_id     uuid default null,
  p_order_id       uuid default null,
  p_restaurant_id  uuid default null,
  p_data           jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  -- Never notify someone about their own action
  if p_user_id = p_actor_id then return; end if;

  insert into public.notifications (
    user_id, actor_id, type, title, body,
    ult_order_id, comment_id, order_id, restaurant_id, data
  ) values (
    p_user_id, p_actor_id, p_type, p_title, p_body,
    p_ult_order_id, p_comment_id, p_order_id, p_restaurant_id, p_data
  );
end;
$$;

-- E1. New like → notify ult_order author
create or replace function public.fn_notify_on_like()
returns trigger
language plpgsql
security definer
as $$
declare
  v_author_id uuid;
  v_title     text;
begin
  if tg_op = 'INSERT' then
    select user_id into v_author_id from public.ult_orders where id = new.ult_order_id;
    select display_name || ' liked your ULT order' into v_title
    from public.users where id = new.user_id;

    perform public.create_notification(
      p_user_id      := v_author_id,
      p_actor_id     := new.user_id,
      p_type         := 'ult_order_liked',
      p_title        := v_title,
      p_ult_order_id := new.ult_order_id,
      p_data         := jsonb_build_object('ult_order_id', new.ult_order_id)
    );
  end if;
  return null;
end;
$$;

drop trigger if exists trg_notify_on_like on public.likes;
create trigger trg_notify_on_like
  after insert on public.likes
  for each row execute procedure public.fn_notify_on_like();

-- E2. New follow → notify the followed user
create or replace function public.fn_notify_on_follow()
returns trigger
language plpgsql
security definer
as $$
declare
  v_title text;
begin
  if tg_op = 'INSERT' then
    select display_name || ' started following you' into v_title
    from public.users where id = new.follower_id;

    perform public.create_notification(
      p_user_id  := new.following_id,
      p_actor_id := new.follower_id,
      p_type     := 'new_follower',
      p_title    := v_title,
      p_data     := jsonb_build_object('follower_id', new.follower_id)
    );
  end if;
  return null;
end;
$$;

drop trigger if exists trg_notify_on_follow on public.follows;
create trigger trg_notify_on_follow
  after insert on public.follows
  for each row execute procedure public.fn_notify_on_follow();

-- E3. New comment → notify ult_order author + parent comment author
create or replace function public.fn_notify_on_comment()
returns trigger
language plpgsql
security definer
as $$
declare
  v_ult_order_author_id uuid;
  v_parent_author_id    uuid;
  v_actor_name          text;
begin
  if tg_op = 'INSERT' then
    select user_id into v_ult_order_author_id
    from public.ult_orders where id = new.ult_order_id;

    select display_name into v_actor_name
    from public.users where id = new.user_id;

    -- Notify ult_order author
    perform public.create_notification(
      p_user_id      := v_ult_order_author_id,
      p_actor_id     := new.user_id,
      p_type         := 'new_comment',
      p_title        := v_actor_name || ' commented on your ULT order',
      p_body         := left(new.body, 100),
      p_ult_order_id := new.ult_order_id,
      p_comment_id   := new.id,
      p_data         := jsonb_build_object('comment_id', new.id, 'ult_order_id', new.ult_order_id)
    );

    -- If reply, also notify the parent comment author
    if new.parent_id is not null then
      select user_id into v_parent_author_id
      from public.comments where id = new.parent_id;

      perform public.create_notification(
        p_user_id      := v_parent_author_id,
        p_actor_id     := new.user_id,
        p_type         := 'comment_reply',
        p_title        := v_actor_name || ' replied to your comment',
        p_body         := left(new.body, 100),
        p_ult_order_id := new.ult_order_id,
        p_comment_id   := new.id,
        p_data         := jsonb_build_object('comment_id', new.id, 'parent_id', new.parent_id)
      );
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_notify_on_comment on public.comments;
create trigger trg_notify_on_comment
  after insert on public.comments
  for each row execute procedure public.fn_notify_on_comment();

-- E4. tried_order → notify ult_order author
create or replace function public.fn_notify_on_tried()
returns trigger
language plpgsql
security definer
as $$
declare
  v_author_id uuid;
  v_actor_name text;
begin
  if tg_op = 'INSERT' then
    select user_id into v_author_id from public.ult_orders where id = new.ult_order_id;
    select display_name into v_actor_name from public.users where id = new.user_id;

    perform public.create_notification(
      p_user_id      := v_author_id,
      p_actor_id     := new.user_id,
      p_type         := 'ult_order_tried',
      p_title        := v_actor_name || ' tried your ULT order!',
      p_ult_order_id := new.ult_order_id,
      p_data         := jsonb_build_object('ult_order_id', new.ult_order_id, 'rating', new.rating)
    );
  end if;
  return null;
end;
$$;

drop trigger if exists trg_notify_on_tried on public.tried_orders;
create trigger trg_notify_on_tried
  after insert on public.tried_orders
  for each row execute procedure public.fn_notify_on_tried();

-- E5. Order status change → notify customer
create or replace function public.fn_notify_on_order_status()
returns trigger
language plpgsql
security definer
as $$
declare
  v_title text;
  v_type  notification_type;
begin
  if tg_op = 'UPDATE' and old.status <> new.status then
    case new.status
      when 'confirmed' then
        v_type  := 'order_confirmed';
        v_title := 'Your order has been confirmed!';
      when 'preparing' then
        v_type  := 'order_preparing';
        v_title := 'Your order is being prepared.';
      when 'ready' then
        v_type  := 'order_ready';
        v_title := 'Your order is ready for pickup!';
      when 'picked_up' then
        v_type  := 'order_picked_up';
        v_title := 'Your order has been picked up.';
      when 'delivered' then
        v_type  := 'order_delivered';
        v_title := 'Your order has been delivered. Enjoy!';
      when 'cancelled' then
        v_type  := 'order_cancelled';
        v_title := 'Your order has been cancelled.';
      else return null;
    end case;

    insert into public.notifications (user_id, type, title, order_id, data)
    values (
      new.customer_id,
      v_type,
      v_title,
      new.id,
      jsonb_build_object(
        'order_id',       new.id,
        'restaurant_id',  new.restaurant_id,
        'status',         new.status
      )
    );
  end if;
  return null;
end;
$$;

drop trigger if exists trg_notify_on_order_status on public.orders;
create trigger trg_notify_on_order_status
  after update of status on public.orders
  for each row execute procedure public.fn_notify_on_order_status();

-- ─────────────────────────────────────────────────────────────
-- F. COLLECTION ITEM COUNT
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_collection_item_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.delta_counter('collections', 'item_count', 'id', new.collection_id, +1);
  elsif (tg_op = 'DELETE') then
    perform public.delta_counter('collections', 'item_count', 'id', old.collection_id, -1);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_collection_item_count on public.collection_items;
create trigger trg_collection_item_count
  after insert or delete on public.collection_items
  for each row execute procedure public.fn_collection_item_count();

-- ─────────────────────────────────────────────────────────────
-- G. PUBLISHED_AT STAMP
--    Set published_at when ult_order transitions to 'published'.
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and old.status <> 'published' then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_published_at on public.ult_orders;
create trigger trg_set_published_at
  before update of status on public.ult_orders
  for each row execute procedure public.fn_set_published_at();

-- ─────────────────────────────────────────────────────────────
-- H. TAG USAGE COUNT
--    Increment/decrement tags.usage_count when ult_order_tags
--    rows are added or removed.
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_tag_usage_counter()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.delta_counter('tags', 'usage_count', 'id', new.tag_id, +1);
  elsif (tg_op = 'DELETE') then
    perform public.delta_counter('tags', 'usage_count', 'id', old.tag_id, -1);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_tag_usage_counter on public.ult_order_tags;
create trigger trg_tag_usage_counter
  after insert or delete on public.ult_order_tags
  for each row execute procedure public.fn_tag_usage_counter();

-- ─────────────────────────────────────────────────────────────
-- I. RESTAURANT REVIEW STATS
--    Recompute average_rating and total_reviews when a review
--    is inserted (reviews table lives in existing schema).
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_update_restaurant_rating()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.restaurants
  set
    average_rating = (
      select round(avg(rating)::numeric, 2)
      from public.reviews
      where restaurant_id = coalesce(new.restaurant_id, old.restaurant_id)
    ),
    total_reviews = (
      select count(*)
      from public.reviews
      where restaurant_id = coalesce(new.restaurant_id, old.restaurant_id)
    )
  where id = coalesce(new.restaurant_id, old.restaurant_id);

  return null;
end;
$$;

drop trigger if exists trg_update_restaurant_rating on public.reviews;
create trigger trg_update_restaurant_rating
  after insert or delete on public.reviews
  for each row execute procedure public.fn_update_restaurant_rating();
