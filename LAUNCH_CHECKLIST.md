# ULT Orders — Pre-Submission Launch Checklist

Complete every item below before submitting to the App Store and Google Play.
Check off each item as you go: change `[ ]` to `[x]`.

---

## 1. App Identity & Metadata

- [ ] Update `app.json` → `extra.eas.projectId` with your real EAS project ID  
  (`eas init` in the project root will generate this)
- [ ] Replace `com.yourname.ultorders` with your real reverse-domain identifier in both  
  `app.json` → `ios.bundleIdentifier` and `android.package`
- [ ] Set your Apple credentials in `eas.json` → `submit.production.ios`:  
  `appleId`, `ascAppId` (from App Store Connect), `appleTeamId`
- [ ] Place `google-service-account.json` at the project root for Android submissions
- [ ] Confirm the app display name (`"ULT Orders"`) is exactly what you want on home screens

---

## 2. Icons, Splash, and Assets

- [ ] Replace placeholder icons in `assets/images/`:  
  — `icon.png` (1024×1024, no alpha, no rounded corners — Apple rounds automatically)  
  — `adaptive-icon.png` (Android foreground, 1024×1024, transparent background)  
  — `splash.png` (1284×2778 for iPhone 15 Pro Max, centred logo on `#F9F9F8` bg)  
  — `notification-icon.png` (Android notification icon, white on transparent, 96×96)  
  — `favicon.png` (web, 48×48)
- [ ] Test the splash screen on both a notched iPhone and an Android device  
  to verify no clipping

---

## 3. Environment Variables & Secrets

- [ ] Create `.env.local` from `.env.local.example` and fill in every key:  
  — `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`  
  — `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`  
  — `EXPO_PUBLIC_SENTRY_DSN` (create project at sentry.io)  
  — `EXPO_PUBLIC_POSTHOG_API_KEY` (create project at posthog.com)
- [ ] Set the same secrets in EAS:  
  `eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "..."`  
  (repeat for each `EXPO_PUBLIC_*` key)
- [ ] Confirm `EXPO_PUBLIC_SENTRY_ENABLED=true` is set in the `preview` and  
  `production` EAS build profiles
- [ ] Rotate and update the Supabase anon key if it was ever committed to version control

---

## 4. Supabase & Backend

- [ ] Run all 4 migrations against your production Supabase project:  
  ```
  supabase db push
  ```  
  or paste each `supabase/migrations/*.sql` file into the SQL Editor in order:  
  `004_postgis → 001_initial_schema → 002_rls_policies → 003_triggers`
- [ ] Create the three storage buckets in Supabase → Storage and set to **Public**:  
  — `ult-order-media`  
  — `avatars`  
  — `restaurant-images`
- [ ] Verify RLS policies are enabled: run in SQL Editor:  
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = false;
  ```  
  The result should be empty.
- [ ] Enable Apple and Google OAuth providers in  
  Supabase → Authentication → Providers and add the redirect URL:  
  `ultorders://auth/callback`
- [ ] Set `Supabase → Authentication → URL Configuration → Site URL` to  
  `https://ultorders.app` (or your production domain)

---

## 5. Permissions Review

- [ ] Confirm all permission strings in `app.json → ios.infoPlist` are  
  human-readable, specific, and explain *why* the permission is needed  
  (Apple rejects vague strings like "Needed for app functionality")
- [ ] Verify `ITSAppUsesNonExemptEncryption: false` is set — this exempts  
  you from French export compliance documentation
- [ ] Test on a physical iOS device that all permission prompts appear with  
  the correct copy before accessing camera, photos, and location
- [ ] Confirm Android `uses-permission` entries in the manifest match what  
  the app actually uses (no over-broad permissions)

---

## 6. Error Monitoring & Analytics

- [ ] Open Sentry → verify the `ult-orders` project exists and the DSN is active
- [ ] Do a test crash: temporarily call `throw new Error("Test Sentry")` in  
  `app/_layout.tsx`, run the preview build, confirm the event arrives in Sentry,  
  then remove the test throw
- [ ] Open PostHog → confirm `order_posted`, `order_liked`, `order_saved`,  
  `user_followed` events are arriving when tested on a real device
- [ ] Set up a PostHog funnel: Create Flow Started → Items Added →  
  Media Added → Details Added → Order Posted — to track completion rate
- [ ] Configure Sentry Alerts: notify on first occurrence of any new issue and  
  on > 10 errors/hour in production

---

## 7. Performance & Crash Testing

- [ ] Run a production build locally with Expo Go or a dev client and scroll  
  the feed for 5+ minutes — watch for memory warnings or frame drops
- [ ] Test cold start time on a mid-range Android device (target < 3s to  
  first interactive frame)
- [ ] Verify pull-to-refresh, infinite scroll, and tab switching are smooth  
  (no blank frames or layout jumps)
- [ ] Test offline behaviour: with airplane mode on, verify the app shows  
  a friendly empty/error state rather than crashing
- [ ] Check that large images (> 5 MB) uploaded via the create flow don't  
  cause a memory crash on older devices

---

## 8. Legal & Compliance

- [ ] Host your privacy policy at the URL set in  
  `app.json → extra.privacyPolicyUrl` (default: `https://ultorders.app/privacy`)  
  — both Apple and Google require a live URL at review time
- [ ] Ensure the privacy policy covers:  
  — Data collected (location, photos, email, usage analytics)  
  — Third-party processors (Supabase, Sentry, PostHog, Google Places)  
  — User rights (deletion request, data export)  
  — Contact email for privacy inquiries
- [ ] Confirm the terms of service URL (`extra.termsUrl`) is also live
- [ ] For iOS: complete the App Privacy questionnaire in App Store Connect  
  — mark location as "Used when app is in use", analytics identifiers as  
  "Used for Analytics", and photos as "Used for App Functionality"
- [ ] If your app is available in the EU, ensure GDPR consent is handled  
  at onboarding before PostHog tracking begins

---

## 9. App Store & Play Store Metadata

- [ ] Write App Store description (max 4000 chars), subtitle (30 chars),  
  and keywords (100 chars) — focus on "food orders", "restaurant", "social"
- [ ] Prepare 6.7" iPhone screenshots (min 3, max 10) and iPad screenshots  
  if `supportsTablet: true`
- [ ] Prepare Android screenshots for phone (min 4) and 7" + 10" tablets  
  if your `AndroidManifest` supports them
- [ ] Set the correct age rating:  
  — iOS: 4+ (no user-generated content filters active yet → consider 12+ with  
  "Infrequent/Mild" for Contests)  
  — Android: PEGI 3 or ESRB Everyone
- [ ] Select the correct App Store categories:  
  Primary: **Food & Drink**, Secondary: **Social Networking**
- [ ] Fill in the "What's new in this version" copy for v1.0.0 (even for  
  initial release, Apple wants something like "Welcome to ULT Orders!")

---

## 10. Final Build Verification

- [ ] Run the production build and install it on at least one physical iPhone  
  and one physical Android device (not simulator):  
  ```bash
  eas build --platform ios --profile production
  eas build --platform android --profile production
  ```
- [ ] Walk through the full user journey end-to-end on the production build:  
  1. Sign up with email  
  2. Complete taste-tag onboarding  
  3. Browse the feed (Following, Trending, Near You)  
  4. Post a 5-step ULT Order with photo  
  5. Like, save, and try someone else's order  
  6. View your own profile with the Deck populated  
  7. Follow another user  
  8. Sign out and sign back in
- [ ] Confirm push notifications arrive when an order is liked/commented on  
  (test using Supabase Edge Functions or Expo push tool)
- [ ] Verify deep links work: `ultorders://auth/callback` redirects correctly  
  after OAuth sign-in
- [ ] Run `eas submit` for both platforms and confirm the builds reach  
  "In Review" status in App Store Connect / Google Play Console:  
  ```bash
  eas submit --platform ios --profile production
  eas submit --platform android --profile production
  ```

---

> **Estimated time to complete:** 4–8 hours for a first submission.  
> **Apple review time:** 1–3 business days.  
> **Google Play review time:** 3–7 business days.
