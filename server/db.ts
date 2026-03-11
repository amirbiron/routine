import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  activities, InsertActivity, Activity,
  schedules, InsertSchedule,
  reflections, InsertReflection,
  tokenEvents, InsertTokenEvent,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: { childName?: string; onboardingDone?: boolean }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateTokenBalance(userId: number, amount: number) {
  const db = await getDb();
  if (!db) return;
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length > 0) {
    const newBalance = Math.max(0, (user[0].tokenBalance || 0) + amount);
    await db.update(users).set({ tokenBalance: newBalance }).where(eq(users.id, userId));
  }
}

// ─── Activities ──────────────────────────────────────────────
export async function getActivities(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activities).where(eq(activities.userId, userId)).orderBy(activities.sortOrder);
}

export async function createActivity(data: InsertActivity) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(activities).values(data);
  return result[0].insertId;
}

export async function updateActivity(id: number, userId: number, data: Partial<InsertActivity>) {
  const db = await getDb();
  if (!db) return;
  await db.update(activities).set(data).where(and(eq(activities.id, id), eq(activities.userId, userId)));
}

export async function deleteActivity(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(activities).where(and(eq(activities.id, id), eq(activities.userId, userId)));
}

export async function bulkCreateActivities(items: InsertActivity[]) {
  const db = await getDb();
  if (!db) return;
  if (items.length === 0) return;
  await db.insert(activities).values(items);
}

// ─── Schedules ───────────────────────────────────────────────
export async function getSchedule(userId: number, date: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(schedules).where(and(eq(schedules.userId, userId), eq(schedules.date, date))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertSchedule(data: InsertSchedule) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getSchedule(data.userId, data.date);
  if (existing) {
    await db.update(schedules).set({ items: data.items, isCompleted: data.isCompleted }).where(eq(schedules.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(schedules).values(data);
    return result[0].insertId;
  }
}

// ─── Reflections ─────────────────────────────────────────────
export async function getReflection(userId: number, date: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(reflections).where(and(eq(reflections.userId, userId), eq(reflections.date, date))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createReflection(data: InsertReflection) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(reflections).values(data);
  return result[0].insertId;
}

export async function getRecentReflections(userId: number, limit: number = 7) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reflections).where(eq(reflections.userId, userId)).orderBy(desc(reflections.date)).limit(limit);
}

// ─── Token Events ────────────────────────────────────────────
export async function createTokenEvent(data: InsertTokenEvent) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(tokenEvents).values(data);
  await updateTokenBalance(data.userId, data.amount);
  return result[0].insertId;
}

export async function getTokenEvents(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tokenEvents).where(eq(tokenEvents.userId, userId)).orderBy(desc(tokenEvents.createdAt)).limit(limit);
}
