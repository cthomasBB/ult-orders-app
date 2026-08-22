/**
 * services/analytics.ts
 *
 * Unified analytics wrapper around PostHog (product analytics)
 * and Sentry (error tracking + performance).
 *
 * Usage:
 *   import { analytics } from "@/services/analytics";
 *   analytics.capture("order_posted", { restaurant_id: "…" });
 *   analytics.identify(userId, { username: "…" });
 */

import PostHog from "posthog-react-native";
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

// ─── Config ───────────────────────────────────────────────────────────────────

const POSTHOG_API_KEY =
  (Constants.expoConfig?.extra?.posthogApiKey as string) ??
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY ??
  "";

const SENTRY_DSN =
  (Constants.expoConfig?.extra?.sentryDsn as string) ??
  process.env.EXPO_PUBLIC_SENTRY_DSN ??
  "";

const APP_ENV = (process.env.APP_ENV ?? "development") as
  | "development"
  | "preview"
  | "production";

const IS_PROD = APP_ENV === "production";
const SENTRY_ENABLED =
  process.env.EXPO_PUBLIC_SENTRY_ENABLED === "true" || IS_PROD;

// ─── PostHog client (singleton) ───────────────────────────────────────────────

let posthog: PostHog | null = null;

export function initPostHog(): PostHog | null {
  if (!POSTHOG_API_KEY) {
    console.warn("[Analytics] PostHog API key not set — events will not be tracked.");
    return null;
  }
  if (posthog) return posthog;

  posthog = new PostHog(POSTHOG_API_KEY, {
    host: "https://us.i.posthog.com",
    // Disable in dev to avoid polluting production data
    disabled: true,
    captureMode: "form",
    persistence: "memory",
  });

  return posthog;
}

// ─── Sentry initialisation ────────────────────────────────────────────────────

export function initSentry() {
  if (!SENTRY_DSN || !SENTRY_ENABLED) {
    console.warn("[Analytics] Sentry DSN not set or disabled — errors will not be reported.");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    debug: !IS_PROD,
    // Capture 20 % of transactions in production for performance monitoring
    tracesSampleRate: IS_PROD ? 0.2 : 1.0,
    // Ignore common non-fatal network errors
    ignoreErrors: [
      "Network request failed",
      "The Internet connection appears to be offline",
      "AbortError",
    ],
    beforeSend(event) {
      // Strip PII from breadcrumbs
      if (event.breadcrumbs?.values) {
        event.breadcrumbs.values = event.breadcrumbs.values.map((b) => ({
          ...b,
          message: b.message?.replace(/email=[^&]+/, "email=[REDACTED]"),
        }));
      }
      return event;
    },
  });
}

// ─── Typed event catalogue ────────────────────────────────────────────────────

export type AnalyticsEvent =
  // Orders
  | { event: "order_posted";     props: { ult_order_id: string; restaurant_id: string | null; item_count: number; has_media: boolean; tag_count: number; added_to_deck: boolean } }
  | { event: "order_viewed";     props: { ult_order_id: string; source: "feed" | "profile" | "search" | "direct" } }
  | { event: "order_liked";      props: { ult_order_id: string; restaurant_id: string } }
  | { event: "order_unliked";    props: { ult_order_id: string } }
  | { event: "order_saved";      props: { ult_order_id: string; restaurant_id: string } }
  | { event: "order_unsaved";    props: { ult_order_id: string } }
  | { event: "order_tried";      props: { ult_order_id: string; restaurant_id: string } }
  | { event: "order_untried";    props: { ult_order_id: string } }
  | { event: "order_shared";     props: { ult_order_id: string; method: "native" | "copy" } }
  // Create flow
  | { event: "create_flow_started";   props: { step: number } }
  | { event: "create_flow_abandoned"; props: { at_step: number } }
  | { event: "create_flow_completed"; props: { item_count: number; media_count: number; has_caption: boolean; tag_count: number } }
  // Social
  | { event: "user_followed";   props: { target_user_id: string; source: "profile" | "suggestions" | "feed" } }
  | { event: "user_unfollowed"; props: { target_user_id: string } }
  | { event: "comment_posted";  props: { ult_order_id: string; is_reply: boolean } }
  // Navigation
  | { event: "tab_changed";       props: { from: string; to: string } }
  | { event: "feed_type_changed"; props: { from: string; to: string } }
  | { event: "restaurant_viewed"; props: { restaurant_id: string } }
  // Auth
  | { event: "sign_up_completed";  props: { method: "email" | "apple" | "google" } }
  | { event: "sign_in_completed";  props: { method: "email" | "apple" | "google" } }
  | { event: "sign_out";           props: Record<string, never> }
  | { event: "onboarding_completed"; props: { tag_count: number; followed_count: number } }
  // Errors
  | { event: "api_error"; props: { endpoint: string; status_code?: number; message: string } };

// ─── analytics singleton ──────────────────────────────────────────────────────

class Analytics {
  private ph: PostHog | null = null;

  init() {
    this.ph = initPostHog();
    initSentry();
  }

  /** Identify an authenticated user */
  identify(userId: string, traits?: Record<string, unknown>) {
    this.ph?.identify(userId, traits as any);
    Sentry.setUser({ id: userId, username: traits?.username as string });
  }

  /** Clear identity on sign-out */
  reset() {
    this.ph?.reset();
    Sentry.setUser(null);
  }

  /** Capture a typed product analytics event */
  capture<E extends AnalyticsEvent["event"]>(
    event: E,
    props: Extract<AnalyticsEvent, { event: E }>["props"]
  ) {
    // PostHog
    this.ph?.capture(event, props as Record<string, unknown>);

    // Sentry breadcrumb for debugging context
    if (SENTRY_ENABLED) {
      Sentry.addBreadcrumb({
        category: "analytics",
        message: event,
        data: props as Record<string, unknown>,
        level: "info",
      });
    }
  }

  /** Track a screen view */
  screen(name: string, props?: Record<string, unknown>) {
    this.ph?.screen(name, props);
  }

  /** Report a caught error to Sentry */
  captureError(error: Error, context?: Record<string, unknown>) {
    if (SENTRY_ENABLED) {
      Sentry.withScope((scope) => {
        if (context) scope.setExtras(context);
        Sentry.captureException(error);
      });
    }
    if (!IS_PROD) {
      console.error("[Analytics.captureError]", error.message, context);
    }
  }

  /** Wrap component with Sentry error boundary */
  get wrap() {
    return Sentry.wrap;
  }
}

export const analytics = new Analytics();
