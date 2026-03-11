import webpush from "web-push";
import { ENV } from "./_core/env";
import * as db from "./db";

// הגדרת VAPID keys
function initWebPush() {
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured — push notifications disabled");
    return false;
  }
  webpush.setVapidDetails(ENV.vapidEmail, ENV.vapidPublicKey, ENV.vapidPrivateKey);
  return true;
}

// מניעת שליחה כפולה — מפתח: "userId:type", ערך: "HH:MM" האחרון שנשלח
const lastSentMap = new Map<string, string>();

/** שליחת push ישירה לרשימת subscriptions */
async function sendPushToSubscriptions(
  userId: number,
  subscriptions: { endpoint: string; p256dh: string; auth: string }[],
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  const results = [];
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      results.push({ endpoint: sub.endpoint, success: true });
    } catch (err: any) {
      // 404/410 — subscription כבר לא תקף, נמחק
      if (err.statusCode === 404 || err.statusCode === 410) {
        await db.deletePushSubscription(userId, sub.endpoint);
        console.log(`[Push] Removed stale subscription for user ${userId}`);
      } else {
        console.error(`[Push] Error sending to user ${userId}:`, err.message);
      }
      results.push({ endpoint: sub.endpoint, success: false, error: err.message });
    }
  }
  return results;
}

/** שליחת push notification למשתמש (לשימוש ב-tRPC routes — בדיקה ידנית וכו') */
export async function sendPushToUser(userId: number, payload: { title: string; body: string; url?: string; tag?: string }) {
  const subscriptions = await db.getPushSubscriptions(userId);
  return sendPushToSubscriptions(userId, subscriptions, payload);
}

/** בדיקה כל דקה — האם מישהו צריך לקבל תזכורת עכשיו */
async function checkReminders() {
  try {
    const usersWithReminders = await db.getUsersWithActiveReminders();
    if (usersWithReminders.length === 0) return;

    for (const { setting, subscriptions } of usersWithReminders) {
      // חישוב השעה הנוכחית ב-timezone של המשתמש
      const now = new Date();
      const userTime = now.toLocaleTimeString("en-GB", {
        timeZone: setting.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // בדיקת תזכורת בוקר
      if (setting.morningEnabled && userTime === setting.morningTime) {
        const key = `${setting.userId}:morning`;
        if (lastSentMap.get(key) !== userTime) {
          await sendPushToSubscriptions(setting.userId, subscriptions, {
            title: "בוקר טוב! ☀️",
            body: "בואו נתכנן את סדר היום של היום",
            url: "/schedule",
            tag: "morning-reminder",
          });
          lastSentMap.set(key, userTime);
        }
      }

      // בדיקת תזכורת ערב
      if (setting.eveningEnabled && userTime === setting.eveningTime) {
        const key = `${setting.userId}:evening`;
        if (lastSentMap.get(key) !== userTime) {
          await sendPushToSubscriptions(setting.userId, subscriptions, {
            title: "שיחת ערב 🌙",
            body: "הגיע הזמן לשיחת סיכום יום",
            url: "/reflection",
            tag: "evening-reminder",
          });
          lastSentMap.set(key, userTime);
        }
      }
    }
  } catch (err) {
    console.error("[Push] Scheduler error:", err);
  }
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/** הפעלת ה-scheduler — בודק כל 60 שניות */
export function startPushScheduler() {
  const ready = initWebPush();
  if (!ready) return;

  console.log("[Push] Scheduler started — checking every 60 seconds");
  // בדיקה ראשונה מיידית
  checkReminders();
  // ואז כל דקה
  schedulerInterval = setInterval(checkReminders, 60_000);
}

export function stopPushScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
