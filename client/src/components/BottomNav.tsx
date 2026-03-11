import { useLocation, Link } from "wouter";
import { CalendarDays, Palette, MessageCircle, Star, Home } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "בית" },
  { href: "/activities", icon: Palette, label: "מאגרים" },
  { href: "/schedule", icon: CalendarDays, label: "היום שלי" },
  { href: "/reflection", icon: MessageCircle, label: "ערב" },
  { href: "/tokens", icon: Star, label: "אסימונים" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t-2 border-dashed border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(item => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <button className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                isActive
                  ? "text-sketch-coral scale-110"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-sans font-medium">{item.label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-sketch-coral mt-0.5" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
