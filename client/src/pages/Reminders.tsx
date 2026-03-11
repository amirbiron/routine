import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Bell, BellOff, Sun, Moon, Send, AlertTriangle } from "lucide-react";
import { usePushNotifications } from "@/_core/hooks/usePushNotifications";

export default function Reminders() {
  const {
    state: pushState,
    subscribe,
    isSubscribed,
    isSupported,
    isDenied,
    isLoading: pushLoading,
    sendTest,
  } = usePushNotifications();

  const { data: settings, isLoading: settingsLoading } = trpc.reminders.get.useQuery();
  const updateMutation = trpc.reminders.update.useMutation({
    onSuccess: () => {
      utils.reminders.get.invalidate();
      toast.success("ההגדרות נשמרו");
    },
  });
  const utils = trpc.useUtils();

  const [morningEnabled, setMorningEnabled] = useState(false);
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningEnabled, setEveningEnabled] = useState(false);
  const [eveningTime, setEveningTime] = useState("20:00");
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // טעינת הגדרות קיימות
  useEffect(() => {
    if (settings) {
      setMorningEnabled(settings.morningEnabled);
      setMorningTime(settings.morningTime);
      setEveningEnabled(settings.eveningEnabled);
      setEveningTime(settings.eveningTime);
    }
  }, [settings]);

  const handleToggleMorning = async () => {
    const newVal = !morningEnabled;
    // אם מפעיל תזכורת ואין הרשאת push — נבקש
    if (newVal && !isSubscribed) {
      const ok = await subscribe();
      if (!ok) {
        toast.error("לא ניתן להפעיל תזכורות ללא הרשאת התראות");
        return;
      }
    }
    setMorningEnabled(newVal);
    updateMutation.mutate({ morningEnabled: newVal, morningTime, timezone: userTimezone });
  };

  const handleToggleEvening = async () => {
    const newVal = !eveningEnabled;
    if (newVal && !isSubscribed) {
      const ok = await subscribe();
      if (!ok) {
        toast.error("לא ניתן להפעיל תזכורות ללא הרשאת התראות");
        return;
      }
    }
    setEveningEnabled(newVal);
    updateMutation.mutate({ eveningEnabled: newVal, eveningTime, timezone: userTimezone });
  };

  const handleMorningTimeChange = (time: string) => {
    setMorningTime(time);
    if (morningEnabled) {
      updateMutation.mutate({ morningTime: time, timezone: userTimezone });
    }
  };

  const handleEveningTimeChange = (time: string) => {
    setEveningTime(time);
    if (eveningEnabled) {
      updateMutation.mutate({ eveningTime: time, timezone: userTimezone });
    }
  };

  const handleTestPush = async () => {
    if (!isSubscribed) {
      const ok = await subscribe();
      if (!ok) return;
    }
    try {
      await sendTest();
      toast.success("נשלחה התראת בדיקה!");
    } catch {
      toast.error("שגיאה בשליחת בדיקה");
    }
  };

  if (settingsLoading || pushState === "loading") {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="sketch-card p-8 animate-pulse text-center">
          <div className="h-6 bg-muted rounded w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-md mx-auto" dir="rtl">
      <h1 className="text-3xl font-hand font-bold mb-6 text-center">תזכורות יומיות</h1>

      {/* אזהרה אם push לא נתמך */}
      {!isSupported && (
        <div className="sketch-card p-4 mb-4 border-red-300 bg-red-50">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            <p className="font-sans text-sm">
              הדפדפן שלך לא תומך בהתראות push.
              {/iPhone|iPad/.test(navigator.userAgent) && " ב-iOS, הוסיפו את האפליקציה למסך הבית."}
            </p>
          </div>
        </div>
      )}

      {/* אזהרה אם ההרשאה נחסמה */}
      {isDenied && (
        <div className="sketch-card p-4 mb-4 border-amber-300 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-700">
            <BellOff size={20} />
            <p className="font-sans text-sm">
              ההתראות חסומות. שנו את ההרשאה בהגדרות הדפדפן כדי לקבל תזכורות.
            </p>
          </div>
        </div>
      )}

      {/* תזכורת בוקר */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sketch-card p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sun size={22} className="text-sketch-sun" />
            <h2 className="font-hand text-xl font-bold">תזכורת בוקר</h2>
          </div>
          <button
            onClick={handleToggleMorning}
            disabled={!isSupported || isDenied || pushLoading}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              morningEnabled ? "bg-sketch-sun" : "bg-muted"
            } ${(!isSupported || isDenied) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                morningEnabled ? "right-0.5" : "right-[calc(100%-1.625rem)]"
              }`}
            />
          </button>
        </div>
        <p className="text-sm text-muted-foreground font-sans mb-3">
          תזכורת לתכנן את סדר היום
        </p>
        {morningEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2"
          >
            <label className="font-sans text-sm">שעה:</label>
            <input
              type="time"
              value={morningTime}
              onChange={(e) => handleMorningTimeChange(e.target.value)}
              className="sketch-card px-3 py-1.5 font-mono text-sm border rounded"
            />
          </motion.div>
        )}
      </motion.div>

      {/* תזכורת ערב */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="sketch-card p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Moon size={22} className="text-sketch-lavender" />
            <h2 className="font-hand text-xl font-bold">תזכורת ערב</h2>
          </div>
          <button
            onClick={handleToggleEvening}
            disabled={!isSupported || isDenied || pushLoading}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              eveningEnabled ? "bg-sketch-lavender" : "bg-muted"
            } ${(!isSupported || isDenied) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                eveningEnabled ? "right-0.5" : "right-[calc(100%-1.625rem)]"
              }`}
            />
          </button>
        </div>
        <p className="text-sm text-muted-foreground font-sans mb-3">
          תזכורת לשיחת סיכום יום
        </p>
        {eveningEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2"
          >
            <label className="font-sans text-sm">שעה:</label>
            <input
              type="time"
              value={eveningTime}
              onChange={(e) => handleEveningTimeChange(e.target.value)}
              className="sketch-card px-3 py-1.5 font-mono text-sm border rounded"
            />
          </motion.div>
        )}
      </motion.div>

      {/* כפתור בדיקה */}
      <div className="text-center">
        <Button
          onClick={handleTestPush}
          disabled={!isSupported || isDenied || pushLoading}
          variant="outline"
          className="sketch-btn font-hand text-base"
        >
          <Send size={16} />
          שלח התראת בדיקה
        </Button>
      </div>

      {/* הסבר */}
      <div className="mt-8 sketch-card p-4">
        <h3 className="font-hand font-bold mb-2 flex items-center gap-2">
          <Bell size={16} />
          איך זה עובד?
        </h3>
        <ul className="text-sm text-muted-foreground font-sans space-y-1 list-disc list-inside">
          <li>בחרו שעה לתזכורת בוקר ו/או ערב</li>
          <li>תקבלו התראה ישירות לטלפון או למחשב</li>
          <li>לחיצה על ההתראה תפתח את האפליקציה</li>
          <li>אפשר לכבות בכל עת</li>
        </ul>
      </div>
    </div>
  );
}
