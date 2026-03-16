import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChildProvider } from "./contexts/ChildContext";
import { useAuth } from "./_core/hooks/useAuth";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import ActivityBank from "./pages/ActivityBank";
import ScheduleBuilder from "./pages/ScheduleBuilder";
import Reflection from "./pages/Reflection";
import Tokens from "./pages/Tokens";
import ParentInfo from "./pages/ParentInfo";
import Reminders from "./pages/Reminders";
import Login from "./pages/Login";
import ChildrenManager from "./pages/ChildrenManager";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";
import { trpc } from "./lib/trpc";
import { useState, useCallback } from "react";

function AppContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const handleOnboardingComplete = useCallback(() => {
    setOnboardingCompleted(true);
    utils.auth.me.invalidate();
  }, [utils]);

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

  // Show onboarding only for authenticated users who haven't completed it
  if (isAuthenticated && user && !(user as any).onboardingDone && !onboardingCompleted) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen paper-bg">
      <AppHeader />
      <main className="pb-16">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/activities" component={ActivityBank} />
          <Route path="/schedule" component={ScheduleBuilder} />
          <Route path="/reflection" component={Reflection} />
          <Route path="/tokens" component={Tokens} />
          <Route path="/reminders" component={Reminders} />
          <Route path="/parents" component={ParentInfo} />
          <Route path="/children" component={ChildrenManager} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {isAuthenticated && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <ChildProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </ChildProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
