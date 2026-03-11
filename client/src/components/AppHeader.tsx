import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { LogIn, LogOut, BookOpen, ArrowRight } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "שגרה בחוסר שגרה",
  "/schedule": "היום שלי",
  "/activities": "המאגרים שלי",
  "/reflection": "שיחת ערב",
  "/tokens": "האסימונים שלי",
  "/parents": "מדריך להורים",
};

export function AppHeader() {
  const { isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const isHome = location === "/";
  const title = PAGE_TITLES[location] || "שגרה בחוסר שגרה";

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b-2 border-dashed border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {!isHome && (
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowRight size={18} />
              </Button>
            </Link>
          )}
          <h1 className="font-hand text-xl font-bold truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-1">
          {isAuthenticated && (
            <>
              <Link href="/parents">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <BookOpen size={16} />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => logout()}>
                <LogOut size={16} />
              </Button>
            </>
          )}
          {!isAuthenticated && (
            <Link href={getLoginUrl()}>
              <Button variant="ghost" size="sm" className="font-hand text-base">
                <LogIn size={16} />
                כניסה
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
