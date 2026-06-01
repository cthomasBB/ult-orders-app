import { supabase } from "./supabase";
import type { DraftRestaurant } from "@/features/orders/createOrderStore";

/**
 * resolveRestaurant
 * Finds or creates a restaurant in the DB and returns its UUID.
 */
export async function resolveRestaurant(
  draft: DraftRestaurant
): Promise<string> {
  // Case 1: Google Places restaurant — find existing by place_id
  if (draft.placeId) {
    const { data: existing } = await supabase
      .from("restaurants")
      .select("id")
      .eq("place_id", draft.placeId)
      .maybeSingle();

    if (existing?.id) return existing.id;

    // Not in DB yet — insert it
    const { data: inserted, error } = await supabase
      .from("restaurants")
      .insert({
        name: draft.name,
        address: draft.address,
        city: draft.city ?? extractCity(draft.address),
        cuisine_type: [],
        place_id: draft.placeId,
      })
      .select("id")
      .single();

    if (error) throw new Error(`Failed to create restaurant: ${error.message}`);
    return inserted.id;
  }

  // Case 2: Manual entry
  const { data: inserted, error } = await supabase
    .from("restaurants")
    .insert({
      name: draft.name,
      address: draft.address,
      city: draft.city ?? extractCity(draft.address),
      cuisine_type: [],
      place_id: null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create restaurant: ${error.message}`);
  return inserted.id;
}

function extractCity(address: string): string | null {
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) return parts[1] ?? null;
  return null;
}
