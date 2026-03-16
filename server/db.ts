import { eq, and, desc, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  children, InsertChild,
  activities, InsertActivity, Activity,
  schedules, InsertSchedule,
  reflections, InsertReflection,
  tokenEvents, InsertTokenEvent,
  pushSubscriptions, InsertPushSubscription,
  reminderSettings, InsertReminderSettings,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

function getDbUrl(): string {
  const url = process.env.DATABASE_URL ?? "";
  // Auto-add SSL for cloud databases (TiDB, PlanetScale, etc.)
  if (url && !url.includes("localhost") && !url.includes("127.0.0.1") && !url.includes("ssl=")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}ssl={"rejectUnauthorized":true}`;
  }
  return url;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(getDbUrl());
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────

/** Strip passwordHash from user object before returning to client */
export function sanitizeUser(user: typeof users.$inferSelect) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  loginMethod: string;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot create user: database not available"); return null; }

  const result = await db.insert(users).values({
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    loginMethod: data.loginMethod,
    lastSignedIn: new Date(),
  });
  return result[0].insertId;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function touchLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

/** עדכון סיסמה ו-loginMethod למשתמש קיים (למשל משתמש OAuth שעובר לסיסמה). זורק שגיאה אם DB לא זמין */
export async function setPasswordHash(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash, loginMethod: "email" }).where(eq(users.id, userId));
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

// ─── Children ────────────────────────────────────────────────
export async function getChildren(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(children).where(eq(children.userId, userId)).orderBy(children.sortOrder);
}

export async function getChild(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(children).where(and(eq(children.id, id), eq(children.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createChild(data: InsertChild) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(children).values(data);
  return result[0].insertId;
}

export async function updateChild(id: number, userId: number, data: Partial<Pick<InsertChild, "name" | "avatarColor" | "sortOrder">>) {
  const db = await getDb();
  if (!db) return;
  await db.update(children).set(data).where(and(eq(children.id, id), eq(children.userId, userId)));
}

export async function deleteChild(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  // מחיקת כל הנתונים של הילד
  await db.delete(activities).where(and(eq(activities.userId, userId), eq(activities.childId, id)));
  await db.delete(schedules).where(and(eq(schedules.userId, userId), eq(schedules.childId, id)));
  await db.delete(reflections).where(and(eq(reflections.userId, userId), eq(reflections.childId, id)));
  await db.delete(tokenEvents).where(and(eq(tokenEvents.userId, userId), eq(tokenEvents.childId, id)));
  await db.delete(children).where(and(eq(children.id, id), eq(children.userId, userId)));
}

// ─── Activities ──────────────────────────────────────────────
export async function getActivities(userId: number, childId?: number | null) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(activities.userId, userId)];
  if (childId != null) conditions.push(eq(activities.childId, childId));
  return db.select().from(activities).where(and(...conditions)).orderBy(activities.sortOrder);
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
export async function getSchedule(userId: number, date: string, childId?: number | null) {
  const db = await getDb();
  if (!db) return null;
  const conditions = [eq(schedules.userId, userId), eq(schedules.date, date)];
  if (childId != null) conditions.push(eq(schedules.childId, childId));
  const result = await db.select().from(schedules).where(and(...conditions)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertSchedule(data: InsertSchedule) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getSchedule(data.userId, data.date, data.childId);
  if (existing) {
    await db.update(schedules).set({ items: data.items, isCompleted: data.isCompleted }).where(eq(schedules.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(schedules).values(data);
    return result[0].insertId;
  }
}

// ─── Reflections ─────────────────────────────────────────────
export async function getReflection(userId: number, date: string, childId?: number | null) {
  const db = await getDb();
  if (!db) return null;
  const conditions = [eq(reflections.userId, userId), eq(reflections.date, date)];
  if (childId != null) conditions.push(eq(reflections.childId, childId));
  const result = await db.select().from(reflections).where(and(...conditions)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createReflection(data: InsertReflection) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(reflections).values(data);
  return result[0].insertId;
}

export async function getRecentReflections(userId: number, limit: number = 7, childId?: number | null) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(reflections.userId, userId)];
  if (childId != null) conditions.push(eq(reflections.childId, childId));
  return db.select().from(reflections).where(and(...conditions)).orderBy(desc(reflections.date)).limit(limit);
}

// ─── Token Events ────────────────────────────────────────────

/** חישוב יתרת אסימונים לפי סכום אירועים — מחושב per-child כשמועבר childId */
export async function getTokenBalance(userId: number, childId?: number | null): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const conditions = [eq(tokenEvents.userId, userId)];
  if (childId != null) conditions.push(eq(tokenEvents.childId, childId));
  const result = await db.select({ total: sum(tokenEvents.amount) }).from(tokenEvents).where(and(...conditions));
  return Number(result[0]?.total) || 0;
}

export async function createTokenEvent(data: InsertTokenEvent) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(tokenEvents).values(data);
  await updateTokenBalance(data.userId, data.amount);
  return result[0].insertId;
}

export async function getTokenEvents(userId: number, limit: number = 20, childId?: number | null) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(tokenEvents.userId, userId)];
  if (childId != null) conditions.push(eq(tokenEvents.childId, childId));
  return db.select().from(tokenEvents).where(and(...conditions)).orderBy(desc(tokenEvents.createdAt)).limit(limit);
}

// ─── Push Subscriptions ─────────────────────────────────────
export async function savePushSubscription(userId: number, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const db = await getDb();
  if (!db) return null;
  // מחיקת subscription ישן עם אותו endpoint
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, subscription.endpoint));
  const result = await db.insert(pushSubscriptions).values({
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });
  return result[0].insertId;
}

export async function deletePushSubscription(userId: number, endpoint: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
}

export async function getPushSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}

// ─── Reminder Settings ──────────────────────────────────────
export async function getReminderSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(reminderSettings).where(eq(reminderSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertReminderSettings(userId: number, data: {
  morningEnabled?: boolean;
  morningTime?: string;
  eveningEnabled?: boolean;
  eveningTime?: string;
  timezone?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  // אטומי — ON DUPLICATE KEY UPDATE מונע race condition ושורות כפולות
  const result = await db.insert(reminderSettings)
    .values({ userId, ...data })
    .onDuplicateKeyUpdate({ set: data });
  return result[0].insertId;
}

/** מחזיר את כל המשתמשים שיש להם תזכורת פעילה עם ה-subscriptions שלהם (שאילתה אחת) */
export async function getUsersWithActiveReminders() {
  const db = await getDb();
  if (!db) return [];
  // JOIN בין reminderSettings ל-pushSubscriptions — שאילתה אחת במקום N+1
  const rows = await db
    .select({
      settingId: reminderSettings.id,
      userId: reminderSettings.userId,
      morningEnabled: reminderSettings.morningEnabled,
      morningTime: reminderSettings.morningTime,
      eveningEnabled: reminderSettings.eveningEnabled,
      eveningTime: reminderSettings.eveningTime,
      timezone: reminderSettings.timezone,
      subEndpoint: pushSubscriptions.endpoint,
      subP256dh: pushSubscriptions.p256dh,
      subAuth: pushSubscriptions.auth,
    })
    .from(reminderSettings)
    .innerJoin(pushSubscriptions, eq(reminderSettings.userId, pushSubscriptions.userId));

  // קיבוץ לפי userId
  const grouped = new Map<number, {
    setting: { id: number; userId: number; morningEnabled: boolean; morningTime: string; eveningEnabled: boolean; eveningTime: string; timezone: string };
    subscriptions: { endpoint: string; p256dh: string; auth: string }[];
  }>();

  for (const row of rows) {
    if (!row.morningEnabled && !row.eveningEnabled) continue;
    if (!grouped.has(row.userId)) {
      grouped.set(row.userId, {
        setting: {
          id: row.settingId,
          userId: row.userId,
          morningEnabled: row.morningEnabled,
          morningTime: row.morningTime,
          eveningEnabled: row.eveningEnabled,
          eveningTime: row.eveningTime,
          timezone: row.timezone,
        },
        subscriptions: [],
      });
    }
    grouped.get(row.userId)!.subscriptions.push({
      endpoint: row.subEndpoint,
      p256dh: row.subP256dh,
      auth: row.subAuth,
    });
  }

  return Array.from(grouped.values());
}
