import { Redirect } from "expo-router";
import { useCreateOrderStore } from "@/features/orders/createOrderStore";

/**
 * Entry point: redirect to whichever step the draft is currently on.
 * The FAB tab button and cart bar both push to /create/restaurant directly.
 */
export default function CreateIndex() {
  const step = useCreateOrderStore((s) => s.draft.step);
  const routes: Record<number, string> = {
    1: "/create/restaurant",
    2: "/create/items",
    3: "/create/media",
    4: "/create/details",
    5: "/create/preview",
  };
  return <Redirect href={(routes[step] ?? "/create/restaurant") as any} />;
}
