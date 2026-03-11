import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

type PushState = "unsupported" | "default" | "granted" | "denied" | "loading";

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const { data: vapidData } = trpc.push.vapidPublicKey.useQuery();
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();
  const testMutation = trpc.push.test.useMutation();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    // בדיקת הרשאות ו-subscription קיים
    Notification.permission === "denied"
      ? setState("denied")
      : navigator.serviceWorker.ready.then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          setSubscription(sub);
          setState(sub ? "granted" : Notification.permission as PushState);
        });
  }, []);

  // רישום Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("[SW] Registration failed:", err);
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!vapidData?.key) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.key) as unknown as ArrayBuffer,
      });

      // שמירה בשרת
      const json = sub.toJSON();
      await subscribeMutation.mutateAsync({
        endpoint: sub.endpoint,
        keys: {
          p256dh: json.keys!.p256dh!,
          auth: json.keys!.auth!,
        },
      });

      setSubscription(sub);
      setState("granted");
      return true;
    } catch (err) {
      console.error("[Push] Subscribe error:", err);
      return false;
    }
  }, [vapidData?.key, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      await unsubscribeMutation.mutateAsync({ endpoint: subscription.endpoint });
      setSubscription(null);
      setState("default");
    } catch (err) {
      console.error("[Push] Unsubscribe error:", err);
    }
  }, [subscription, unsubscribeMutation]);

  const sendTest = useCallback(async () => {
    return testMutation.mutateAsync();
  }, [testMutation]);

  return {
    state,
    subscription,
    subscribe,
    unsubscribe,
    sendTest,
    isSubscribed: !!subscription,
    isSupported: state !== "unsupported",
    isDenied: state === "denied",
    isLoading: state === "loading" || subscribeMutation.isPending,
  };
}

// המרת VAPID key מ-base64 ל-Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
