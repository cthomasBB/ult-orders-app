import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/features/auth/authStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications, persist the Expo token to Supabase,
 * and handle deep-link navigation when a notification is tapped.
 */
export function useNotifications() {
  const { user } = useAuthStore();
  const router = useRouter();
  const notifListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // 1. Register and persist token
    registerForPushNotifications().then(async (token) => {
      if (token && user?.id) {
        await supabase
          .from("push_tokens")
          .upsert({ user_id: user.id, token, platform: Platform.OS });
      }
    });

    // 2. Foreground notification received
    notifListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Push] received:", notification.request.identifier);
      }
    );

    // 3. Notification tapped → deep-link
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<
          string,
          string
        >;

        if (data?.order_id) {
          router.push(`/order/${data.order_id}`);
        } else if (data?.restaurant_id) {
          router.push(`/restaurant/${data.restaurant_id}`);
        } else if (data?.username) {
          router.push(`/profile/${data.username}`);
        } else {
          // Default: go to orders tab
          router.push("/(tabs)/orders");
        }
      });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id]);
}

async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  } catch {
    return null; // fails in simulator without a real device
  }
}
