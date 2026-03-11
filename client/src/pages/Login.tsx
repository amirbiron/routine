import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup
        ? { email, password, name }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      await utils.auth.me.invalidate();
      setLocation("/");
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen paper-bg flex items-center justify-center p-4">
      <div className="sketch-card p-8 w-full max-w-sm">
        <h1 className="font-hand text-3xl font-bold text-center mb-2">
          {isSignup ? "הרשמה" : "כניסה"}
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-6">
          שגרה בחוסר שגרה
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium mb-1">שם</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="השם שלך"
                dir="rtl"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="your@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={isSignup ? "לפחות 6 תווים" : "הסיסמה שלך"}
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full sketch-btn bg-sketch-coral text-white border-sketch-charcoal font-hand text-lg h-12"
          >
            {loading ? "..." : isSignup ? "הרשמה" : "כניסה"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            {isSignup ? "יש לי כבר חשבון — כניסה" : "אין לי חשבון — הרשמה"}
          </button>
        </div>
      </div>
    </div>
  );
}
