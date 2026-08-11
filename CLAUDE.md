# CLAUDE.md — ULT Orders

This file is read automatically at the start of every Claude Code session. It is the project's persistent memory. Read it fully before making changes.

---

## 1. What ULT Orders Is

ULT Orders is a **social food identity platform**. Users share their go-to restaurant orders, building a food identity and a social graph around trusted, repeatable recommendations.

**It is NOT:**
- a Yelp clone
- a review platform
- a delivery app
- a generic foodie app

**It IS:**
- a social utility platform
- a food identity platform
- a creator-driven recommendation engine
- a structured order-sharing ecosystem

The core question every screen serves: **"What should I order here?"**

Long-term vision: the IMDb + Letterboxd + Instagram equivalent for food orders — the social graph of food preferences, a creator platform, a restaurant intelligence layer, and eventually a data/trend platform for restaurants and brands.

**Launch market:** Las Vegas. **Expansion:** Los Angeles, then New York City.

---

## 2. Product Principles (do not violate without explicit discussion)

- Users post their **go-to order** and food identity — not meals, not reviews.
- **Saves** and **Verified Tried It** confirmations are the strongest trust signals. Saves are weighted 4× over likes in ranking.
- **Restaurant pages** = decision engines. **Profiles** = identity engines. **Feeds** = discovery engines.
- Every screen must answer: *"What action should the user take next?"*
- Feed philosophy: utility, trust, saves, repeatability, creator credibility, recency blended with quality.
- Explicitly avoid: ragebait, fake virality, vanity metrics.

When proposing features, prioritize: emotional engagement, social status dynamics, retention loops, creator incentives, user expression.

---

## 3. Hard Constraints — Never Violate

### Dependencies
- **`react-native-reanimated` MUST stay pinned at `3.16.7`.** Never upgrade to 4.x. Breaking changes surface as confusing runtime crashes, not clean install errors.
- **All npm installs require `--legacy-peer-deps`.** The dependency tree has peer conflicts npm's strict resolver rejects.
- **Never run `npm audit fix --force`.** It will jump packages across major versions and break the reanimated pin.

### Platform
- iOS binaries **cannot** be built locally on Windows. Device builds require **EAS Build** (Expo's cloud service on Apple hardware). Expo Go covers all development needs until TestFlight.
- Project path: `C:\dev\ult-orders-app` — deliberately outside OneDrive to prevent `node_modules` sync corruption.

---

## 4. Supabase Patterns — Learned the Hard Way

### GRANT vs RLS (recurring silent failure mode)
Missing **GRANT permissions** are distinct from RLS policy violations and fail silently in confusing ways. Always verify separately:

```sql
GRANT INSERT, SELECT, UPDATE, DELETE ON <table> TO authenticated;
```

An RLS policy can be perfect and the operation still fails if the GRANT is missing. Check both.

### No nested subqueries
**Nested Supabase subqueries do not work in the JS client.** Never write them. Restructure as separate queries or use a database function/view.

### RLS DELETE policies
DELETE policies require an explicit ownership check:
```sql
USING (auth.uid() = user_id)
```

### Verify schema before writing SQL
Always confirm the actual database schema before writing or proposing SQL fixes. Never assume column names or types from memory or from application code.

### Migration tracking is not trustworthy
Supabase's migration tracking table is **empty** (`list_migrations` returns `[]`) even though a full schema clearly exists and the app works. The live DB was built by hand at some point (SQL editor / dashboard), not via tracked migrations. This means `.sql` files under `supabase/migrations/` may describe *intent*, not *deployed state* — a file can be well-written, committed, and never actually run.

Concretely: `003_triggers.sql` defines the trigger that maintains `users.follower_count`/`following_count`, and it looked correct on read — but the trigger and its backing function did not exist in the live database at all, and every counter it should have maintained was silently frozen at 0/seed values.

**Before trusting or building on any migration file, verify the corresponding table/column/trigger/function actually exists in the live DB** — query `information_schema.columns`, `information_schema.triggers`, or `pg_proc` directly. Don't assume a `.sql` file in the repo reflects what's deployed.

### Known-missing schema (as of 2026-08-11)
These tables, referenced by `supabase/migrations/003_triggers.sql`, do **not** exist in the live DB: `comments`, `collections`, `collection_items`, `tags`, `ult_order_tags`, `reviews`, `menu_items`, `order_items`, `orders`, `notifications`. Two columns referenced by that same file are also missing: `restaurants.save_count`, `restaurants.ult_order_count`.

As a result, the following trigger logic from that file was **not** applied and is not active: comment_count maintenance, collection item counts, tag usage counts, restaurant review stats (avg rating / total reviews), order-item price snapshotting + order totals, and all in-database notification fanout (likes/follows/comments/tries/order-status). Only the sections targeting tables that do exist were applied: like/save/try counters on `ult_orders`, follow counters on `users`, `users.ult_order_count`, trending score (minus its comments-sourced trigger), and the `published_at` stamp.

If any of the deferred features these sections belong to (comments, collections, tags, reviews, in-app ordering, notifications) get built, the matching trigger logic needs to be applied at the same time the tables are created — it won't happen automatically just because it's sitting in the migration file.

---

## 5. Media Upload Pipeline (confirmed working — do not refactor)

The only working path for media upload:

```
expo-file-system/legacy
  → read file as base64 string
  → decode() from base64-arraybuffer
  → Supabase native base64 upload
```

**Do not replace this with `fetch()` on local `file://` URIs.** That approach returns empty blobs on React Native and fails silently — the upload "succeeds" with zero bytes.

Key packages: `expo-file-system/legacy`, `base64-arraybuffer`.

---

## 6. Tech Stack

- Expo SDK 54, Expo Router v3, React Native, TypeScript
- Zustand (client state), TanStack React Query v5 (server state)
- Supabase (auth + database + storage), PostGIS
- EAS Build (iOS/Android binaries)
- Sentry (currently disabled), PostHog (22 typed events defined, key currently empty)

### Environment variables (7, in gitignored `.env`)
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
APP_ENV
EXPO_PUBLIC_SENTRY_ENABLED
EXPO_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_POSTHOG_API_KEY
```

Never commit `.env`. Never expose the Supabase `service_role` key in client code — only the `anon` key.

---

## 7. Design System

**Aesthetic:** Dark mode first. Cinematic food presentation. Strong typography hierarchy. Asymmetric layouts. Premium motion. Intentional whitespace.

Reference points: premium lifestyle / streetwear / Apple-level polish.
**Anti-references:** Yelp, delivery apps, cartoon food branding, stock food photography.

### Tokens
| Token | Hex | Use |
|---|---|---|
| Ember red | `#C8472B` | Primary accent |
| Sage green | `#4A7C59` | Saved states |
| Tried purple | `#6B4FA0` | Tried-it states |
| Ring gold | `#C9A84C` | Status levels |
| Warm off-white | `#F9F9F8` | Surface |

**Typefaces:** Cormorant Garamond (display), DM Sans (UI/body).

---

## 8. Product Terminology (use these exact terms)

ULT Order · Signature Order Deck · go-to orders · Verified Tried It · Hidden Gem · Fan Favorite · First Bite badge · Tastemaker · save graph · ordering intelligence layer · content density threshold

---

## 9. Current State

### Working
- Auth + route guards
- Full post creation: Google Places → `resolveRestaurant()` → base64 media upload → writes to `ult_orders`, `ult_order_items`, `ult_order_media`
- All three feed tabs (Following, Trending, Near You)
- Follow system with real-time feed invalidation
- Me tab with three sub-tabs (Deck / Orders / Saved); Deck capped at 5
- Delete post, edit profile/bio, MediaCarousel with multi-photo support
- Follower/following counts on both profile screens (Me tab + public profile), backed by live DB triggers on `follows` (verified 2026-08-11, see Section 4)

### Remaining before MVP close-out
- Feed cache invalidation after posting
- Add-to-deck in the create flow

### Deferred (post-MVP, in order)
1. Visual design pass (dark mode, premium motion)
2. Landing page + waitlist (orders.com, GoDaddy domain)
3. Badge system, Verified Tried It
4. Creator monetization, restaurant dashboards, verified creators, promoted orders, reservation integrations, loyalty, AI recommendations, travel discovery, food maps, short-form video

Architecture should preserve flexibility for phase-4 items without building for them now.

---

## 10. How to Work With This Founder

Chazman is a **solo, non-technical founder**. Adjust accordingly:

- Explain **why** something happened, not just how to fix it.
- Give **exact commands** and expected outcomes.
- State which terminal/directory a command runs in. Every new PowerShell window needs `cd C:\dev\ult-orders-app` first.
- Be **opinionated** — recommend, don't enumerate neutral options.
- **Challenge weak ideas.** Do not agree automatically.
- Proactively flag: weak product decisions, scalability risks, UX friction, architectural mistakes.

### Debugging discipline
1. Diagnose root cause **before** attempting any fix.
2. Verify actual file contents before modifying — never assume.
3. Exhaust diagnostic reasoning before changing code.
4. Never insert new code without removing the old lines (avoids duplicates).
5. Explain why the issue happened and how to prevent recurrence.

### Code standards
Readability, scalability, modularity, production-grade organization, clean naming, minimal technical debt.

Avoid: overengineering, unnecessary dependencies, bloated abstractions, premature optimization, duplicate logic, fragile hacks.

Explain tradeoffs. Recommend the simplest scalable solution. Optimize for **solo-founder maintainability**.

---

## 11. Networking Notes

- **Home Wi-Fi:** plain `npx expo start` (LAN mode) works.
- **Regus office Wi-Fi:** client/AP isolation blocks device-to-device LAN. ngrok tunnels also appear to be blocked (`remote gone away`).
- **Working solution at Regus:** connect the PC to the iPhone's Personal Hotspot, then run plain `npx expo start`. Do `npm install` steps on office Wi-Fi first to preserve cellular data.

---

## 12. Repository

GitHub: `cthomasBB/ult-orders-app`
Supabase project: `https://teldswjtcemvzgzwibsg.supabase.co`
