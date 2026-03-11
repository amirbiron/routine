import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  childName: varchar("childName", { length: 100 }),
  onboardingDone: boolean("onboardingDone").default(false).notNull(),
  tokenBalance: int("tokenBalance").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  icon: varchar("icon", { length: 50 }).default("star").notNull(),
  color: varchar("color", { length: 20 }).default("coral").notNull(),
  category: mysqlEnum("category", [
    "solo",
    "social",
    "movement",
    "screens",
  ]).default("solo").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  items: json("items").notNull(), // [{activityId, section, completed, order, ...}]
  isCompleted: boolean("isCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

export const reflections = mysqlTable("reflections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scheduleId: int("scheduleId"),
  date: varchar("date", { length: 10 }).notNull(),
  enjoyedMost: text("enjoyedMost"),
  hardest: text("hardest"),
  whatHelped: text("whatHelped"),
  tomorrowWish: text("tomorrowWish"),
  mood: mysqlEnum("mood", ["great", "good", "okay", "hard", "tough"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reflection = typeof reflections.$inferSelect;
export type InsertReflection = typeof reflections.$inferInsert;

// Push notification subscriptions
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// הגדרות תזכורות יומיות
export const reminderSettings = mysqlTable("reminderSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  morningEnabled: boolean("morningEnabled").default(false).notNull(),
  morningTime: varchar("morningTime", { length: 5 }).default("08:00").notNull(), // HH:MM
  eveningEnabled: boolean("eveningEnabled").default(false).notNull(),
  eveningTime: varchar("eveningTime", { length: 5 }).default("20:00").notNull(), // HH:MM
  timezone: varchar("timezone", { length: 64 }).default("Asia/Jerusalem").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReminderSettings = typeof reminderSettings.$inferSelect;
export type InsertReminderSettings = typeof reminderSettings.$inferInsert;

export const tokenEvents = mysqlTable("tokenEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  reason: varchar("reason", { length: 200 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TokenEvent = typeof tokenEvents.$inferSelect;
export type InsertTokenEvent = typeof tokenEvents.$inferInsert;
