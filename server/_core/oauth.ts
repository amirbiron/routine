import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { hashPassword, verifyPassword, sdk } from "./sdk";

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
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
        return;
      }

      const { email, password, name } = parsed.data;

      const passwordHash = await hashPassword(password);
      let userId: number | undefined;
      try {
        userId = await db.createUser({
          email,
          name,
          passwordHash,
          loginMethod: "email",
        });
      } catch (err: any) {
        // unique constraint על email — גם אם שני בקשות הגיעו במקביל
        if (err?.code === "ER_DUP_ENTRY" || err?.message?.includes("Duplicate")) {
          res.status(401).json({ error: "Invalid email or password" });
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
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
        return;
      }

      const { email, password } = parsed.data;

      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      let isValid = false;
      try {
        isValid = await verifyPassword(password, user.passwordHash);
      } catch {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      if (!isValid) {
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
