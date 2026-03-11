import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { hashPassword, verifyPassword, sdk } from "./sdk";

// ─── Rate Limiting (in-memory) ─────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 דקות
const MAX_ATTEMPTS = 10; // מקסימום ניסיונות בחלון זמן

const attempts = new Map<string, { count: number; resetAt: number }>();

/** ניקוי רשומות ישנות כל 5 דקות */
setInterval(() => {
  const now = Date.now();
  attempts.forEach((entry, key) => {
    if (now > entry.resetAt) attempts.delete(key);
  });
}, 5 * 60 * 1000);

function getRateLimitKey(req: Request): string {
  // req.ip מכבד את trust proxy ולוקח את ה-IP האמיתי של הלקוח
  return req.ip ?? "unknown";
}

/** בודק rate limit. מחזיר true אם חסום. לא סופר — צריך לקרוא ל-recordFailedAttempt בנפרד */
function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= MAX_ATTEMPTS;
}

/** רישום ניסיון כושל בלבד */
function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count++;
  }
}

const signupSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(6).max(128),
  name: z.string().min(1).max(200),
});

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
});

export function registerAuthRoutes(app: Express) {
  // ─── Signup ────────────────────────────────────────────────────
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const rateLimitKey = getRateLimitKey(req);
    try {
      if (isRateLimited(rateLimitKey)) {
        res.status(429).json({ error: "Too many attempts. Please try again later." });
        return;
      }

      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        recordFailedAttempt(rateLimitKey);
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
        return;
      }

      const { password, name } = parsed.data;
      const email = parsed.data.email.toLowerCase();

      const passwordHash = await hashPassword(password);
      let userId: number | undefined;
      try {
        userId = await db.createUser({
          email,
          name,
          passwordHash,
          loginMethod: "email",
        }) ?? undefined;
      } catch (err: any) {
        // אימייל כבר קיים (כולל משתמשי OAuth ישנים) — הודעה גנרית
        if (err?.code === "ER_DUP_ENTRY" || err?.message?.includes("Duplicate")) {
          recordFailedAttempt(rateLimitKey);
          res.status(409).json({ error: "Could not create account. Try logging in instead." });
          return;
        }
        throw err;
      }

      if (!userId) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      const sessionToken = await sdk.createSessionToken(userId, {
        email,
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Signup failed", error);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  // ─── Login ─────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const rateLimitKey = getRateLimitKey(req);
    try {
      if (isRateLimited(rateLimitKey)) {
        res.status(429).json({ error: "Too many attempts. Please try again later." });
        return;
      }

      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        recordFailedAttempt(rateLimitKey);
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
        return;
      }

      const { password } = parsed.data;
      const email = parsed.data.email.toLowerCase();

      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        recordFailedAttempt(rateLimitKey);
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      let isValid = false;
      try {
        isValid = await verifyPassword(password, user.passwordHash);
      } catch {
        recordFailedAttempt(rateLimitKey);
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      if (!isValid) {
        recordFailedAttempt(rateLimitKey);
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      await db.touchLastSignedIn(user.id);

      const sessionToken = await sdk.createSessionToken(user.id, {
        email: user.email ?? "",
        name: user.name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}
