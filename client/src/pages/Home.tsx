import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { CalendarDays, Palette, MessageCircle, Star, BookOpen, LogIn } from "lucide-react";
import { Link } from "wouter";

function SketchDoodle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={`opacity-20 ${className}`} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="30" cy="30" r="20" strokeDasharray="4 3" />
      <rect x="65" y="10" width="40" height="40" rx="4" strokeDasharray="4 3" transform="rotate(5 85 30)" />
      <polygon points="60,80 90,110 30,110" strokeDasharray="4 3" />
      <line x1="10" y1="70" x2="50" y2="65" strokeDasharray="6 4" />
    </svg>
  );
}

const FEATURE_CARDS = [
  { href: "/schedule", icon: CalendarDays, cssColor: "var(--color-sketch-sky)", title: "היום שלי", desc: "בניית סדר יום עם גרירה" },
  { href: "/activities", icon: Palette, cssColor: "var(--color-sketch-coral)", title: "המאגרים שלי", desc: "ניהול פעילויות וקטגוריות" },
  { href: "/reflection", icon: MessageCircle, cssColor: "var(--color-sketch-lavender)", title: "שיחת ערב", desc: "רפלקציה על היום שעבר" },
  { href: "/tokens", icon: Star, cssColor: "var(--color-sketch-sun)", title: "האסימונים שלי", desc: "מערכת חיזוקים ותגמולים" },
  { href: "/parents", icon: BookOpen, cssColor: "var(--color-sketch-mint)", title: "מדריך להורים", desc: "הסבר על עוגני שגרה" },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen paper-bg flex items-center justify-center">
        <div className="sketch-card p-8 animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-muted rounded w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen paper-bg">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <SketchDoodle className="absolute top-4 left-4 w-24 h-24" />
        <SketchDoodle className="absolute bottom-4 right-4 w-20 h-20 rotate-45" />

        <div className="container py-12 sm:py-16 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-hand font-bold leading-tight mb-4">
              שגרה
              <br />
              <span className="text-sketch-coral">בחוסר שגרה</span>
            </h1>
            <p className="text-lg sm:text-xl text-foreground/70 max-w-md mx-auto leading-relaxed">
              כלי אינטראקטיבי ליצירת עוגנים של שגרה בתוך האין-שגרה,
              לסייע לתחושת הביטחון בבית
            </p>
          </motion.div>

          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <a href={getLoginUrl()}>
                <Button className="sketch-btn bg-sketch-coral text-white border-sketch-charcoal font-hand text-xl h-14 px-8">
                  <LogIn size={22} />
                  בואו נתחיל!
                </Button>
              </a>
            </motion.div>
          )}

          {isAuthenticated && user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <p className="font-hand text-2xl">
                שלום{(user as any)?.childName ? ` ${(user as any).childName}` : ""}!
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Feature cards */}
      {isAuthenticated && (
        <div className="container pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {FEATURE_CARDS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Link href={item.href}>
                    <div className="sketch-card p-5 flex items-center gap-4 cursor-pointer h-full">
                      <div
                        className="w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0"
                        style={{
                          borderColor: item.cssColor,
                          backgroundColor: `color-mix(in oklch, ${item.cssColor} 15%, transparent)`,
                        }}
                      >
                        <Icon size={24} style={{ color: item.cssColor }} />
                      </div>
                      <div>
                        <h3 className="font-hand text-xl font-bold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info section for non-authenticated */}
      {!isAuthenticated && (
        <div className="container py-12">
          <div className="max-w-lg mx-auto space-y-6">
            {[
              { icon: "📋", title: "בנו סדר יום", desc: "גררו פעילויות מהמאגר ובנו לוז יומי מותאם אישית" },
              { icon: "🎨", title: "מאגר פעילויות", desc: "צרו מאגר פעילויות לבד, עם המשפחה, בתנועה ועם מסכים" },
              { icon: "💬", title: "שיחת ערב", desc: "רפלקציה אינטראקטיבית על היום שעבר" },
              { icon: "⭐", title: "אסימונים", desc: "מערכת חיזוקים עם חגיגות וירטואליות" },
              { icon: "🖨️", title: "הדפסה", desc: "הפקת לוז להדפסה לשימוש יומיומי" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="sketch-card p-4 flex items-center gap-4"
              >
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h3 className="font-hand text-lg font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
