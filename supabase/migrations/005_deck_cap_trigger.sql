-- ─────────────────────────────────────────────────────────────
-- 005. SIGNATURE ORDER DECK CAP
--
-- Enforces the 5-order Deck limit at the database level.
-- Previously this was only checked client-side (toggleDeck() in
-- app/(tabs)/profile.tsx), which is advisory, not authoritative —
-- any other write path (a second UI entry point, a retried
-- request, an admin tool) could push a user past 5 with nothing
-- to stop it.
--
-- NOTE: live schema drift — public.ult_orders does NOT have the
-- is_pinned/pin_order columns described in 001_initial_schema.sql.
-- It has a single `is_deck boolean` column instead, added by hand
-- outside of tracked migrations (see CLAUDE.md section 4). This
-- migration targets the live column.
-- ─────────────────────────────────────────────────────────────

create or replace function public.fn_enforce_deck_cap()
returns trigger
language plpgsql
as $$
declare
  deck_count integer;
begin
  -- Only relevant when this row is (or is becoming) part of the deck
  if new.is_deck is not true then
    return new;
  end if;

  -- No-op update (is_deck already true, still true) — nothing to check
  if tg_op = 'UPDATE' and old.is_deck is true then
    return new;
  end if;

  select count(*) into deck_count
  from public.ult_orders
  where user_id = new.user_id
    and is_deck = true
    and id <> new.id;

  if deck_count >= 5 then
    raise exception 'Signature Deck is full: user % already has 5 orders on their deck', new.user_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- Fires on INSERT (add-to-deck-on-publish sets is_deck at insert time)
-- as well as UPDATE OF is_deck (the existing Me-tab toggle).
drop trigger if exists trg_enforce_deck_cap on public.ult_orders;
create trigger trg_enforce_deck_cap
  before insert or update of is_deck on public.ult_orders
  for each row execute procedure public.fn_enforce_deck_cap();
