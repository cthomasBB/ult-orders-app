const PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const BASE_URL = "https://maps.googleapis.com/maps/api/place";

export type PlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};

export type PlaceDetails = {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  opening_hours?: { open_now: boolean };
  photos?: Array<{ photo_reference: string }>;
  types: string[];
};

/** Search for place autocomplete suggestions */
export async function searchPlaces(
  input: string,
  locationBias?: { lat: number; lng: number }
): Promise<PlacePrediction[]> {
  const params = new URLSearchParams({
    input,
    key: PLACES_API_KEY ?? "",
    types: "establishment",
    ...(locationBias && {
      location: `${locationBias.lat},${locationBias.lng}`,
      radius: "5000",
    }),
  });

  const res = await fetch(`${BASE_URL}/autocomplete/json?${params}`);
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API error: ${data.status}`);
  }

  return data.predictions ?? [];
}

/** Fetch full details for a place by ID */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const params = new URLSearchParams({
    place_id: placeId,
    key: PLACES_API_KEY ?? "",
    fields:
      "place_id,name,formatted_address,geometry,rating,opening_hours,photos,types",
  });

  const res = await fetch(`${BASE_URL}/details/json?${params}`);
  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error(`Places Details API error: ${data.status}`);
  }

  return data.result;
}

/** Build a photo URL from a photo reference */
export function getPhotoUrl(photoReference: string, maxWidth = 400): string {
  const params = new URLSearchParams({
    photoreference: photoReference,
    maxwidth: String(maxWidth),
    key: PLACES_API_KEY ?? "",
  });

  return `${BASE_URL}/photo?${params}`;
}
