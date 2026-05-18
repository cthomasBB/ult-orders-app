import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { useFeedStore } from "@/features/feed/store";

type LocationState = {
  coords: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

/** Request location permission and watch the user's position. */
export function useLocation(): LocationState {
  const setUserLocation = useFeedStore((s) => s.setUserLocation);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission not granted.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const point = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setCoords(point);
      setUserLocation(point);
    } catch (e) {
      setError("Failed to get location.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return { coords, error, isLoading, refresh: fetchLocation };
}
