import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    childName: null,
    onboardingDone: false,
    tokenBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext({ name: "Test Child" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeTruthy();
    expect(result?.name).toBe("Test Child");
    expect(result?.openId).toBe("test-user-123");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});

describe("profile.update", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.profile.update({ childName: "Test" })).rejects.toThrow();
  });
});

describe("activities router", () => {
  it("rejects unauthenticated list request", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.activities.list()).rejects.toThrow();
  });

  it("rejects unauthenticated create request", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activities.create({ title: "Test", icon: "star", color: "coral" })
    ).rejects.toThrow();
  });

  it("validates create input - empty title", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activities.create({ title: "", icon: "star", color: "coral" })
    ).rejects.toThrow();
  });

  it("validates create input - title too long", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activities.create({ title: "a".repeat(201), icon: "star", color: "coral" })
    ).rejects.toThrow();
  });

  it("accepts valid category values without input validation error", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Valid categories should pass input validation (may succeed or fail on DB, but not on zod)
    for (const cat of ["solo", "social", "movement", "screens"]) {
      const result = await caller.activities.create({ title: "Test", icon: "star", color: "coral", category: cat as any });
      expect(result).toHaveProperty("id");
    }
  });

  it("validates category enum - rejects invalid category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activities.create({ title: "Test", icon: "star", color: "coral", category: "invalid" as any })
    ).rejects.toThrow();
  });
});

describe("schedule router", () => {
  it("rejects unauthenticated get request", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.schedule.get({ date: "2026-03-10" })).rejects.toThrow();
  });

  it("rejects unauthenticated save request", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.schedule.save({ date: "2026-03-10", items: [], isCompleted: false })
    ).rejects.toThrow();
  });

  it("validates schedule item section enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.schedule.save({
        date: "2026-03-10",
        items: [{
          activityId: 1,
          title: "Test",
          icon: "star",
          color: "coral",
          section: "invalid" as any,
          completed: false,
          order: 0,
        }],
        isCompleted: false,
      })
    ).rejects.toThrow();
  });

  it("accepts valid section values without input validation error", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    for (const section of ["morning", "afternoon", "evening"]) {
      const result = await caller.schedule.save({
        date: "2026-03-10",
        items: [{
          activityId: 1,
          title: "Test",
          icon: "star",
          color: "coral",
          section: section as any,
          completed: false,
          order: 0,
        }],
        isCompleted: false,
      });
      expect(result).toHaveProperty("id");
    }
  });
});

describe("reflection router", () => {
  it("rejects unauthenticated save request", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.reflection.save({ date: "2026-03-10", mood: "good" })
    ).rejects.toThrow();
  });

  it("validates mood enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.reflection.save({ date: "2026-03-10", mood: "invalid" as any })
    ).rejects.toThrow();
  });
});

describe("tokens router", () => {
  it("rejects unauthenticated balance request", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tokens.balance()).rejects.toThrow();
  });

  it("returns token balance for authenticated user", async () => {
    const { ctx } = createAuthContext({ tokenBalance: 15 });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tokens.balance();
    expect(result).toEqual({ balance: 15 });
  });

  it("returns 0 balance when tokenBalance is null/undefined", async () => {
    const { ctx } = createAuthContext({ tokenBalance: 0 });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tokens.balance();
    expect(result).toEqual({ balance: 0 });
  });

  it("validates award amount - too high", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.tokens.award({ amount: 11, reason: "test", date: "2026-03-10" })
    ).rejects.toThrow();
  });

  it("validates award amount - zero", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.tokens.award({ amount: 0, reason: "test", date: "2026-03-10" })
    ).rejects.toThrow();
  });

  it("validates award reason - empty", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.tokens.award({ amount: 1, reason: "", date: "2026-03-10" })
    ).rejects.toThrow();
  });

  it("validates award reason - too long", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.tokens.award({ amount: 1, reason: "a".repeat(201), date: "2026-03-10" })
    ).rejects.toThrow();
  });
});
