import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { ENV } from "./_core/env";
import { sendPushToUser } from "./pushScheduler";

const categoryEnum = z.enum(["solo", "social", "movement", "screens"]);
const sectionEnum = z.enum(["morning", "afternoon", "evening"]);

// childId אופציונלי — תאימות אחורה למשתמשים ללא ילד מוגדר
const optionalChildId = z.number().optional();

// בדיקת בעלות — וידוא שה-childId שייך למשתמש המחובר
async function assertChildOwnership(childId: number | undefined, userId: number) {
  if (childId == null) return;
  const owns = await db.verifyChildOwnership(childId, userId);
  if (!owns) {
    throw new TRPCError({ code: "FORBIDDEN", message: "הילד לא שייך למשתמש" });
  }
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ?? null),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  profile: router({
    update: protectedProcedure
      .input(z.object({
        childName: z.string().min(1).max(100).optional(),
        onboardingDone: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ─── ילדים ─────────────────────────────────────────────────
  children: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const existing = await db.getChildren(ctx.user.id);
      if (existing.length > 0) return existing;

      // backfill אטומי — משתמשים ישנים עם childName בטבלת users אבל בלי רשומה בטבלת children
      const childName = (ctx.user as any).childName;
      if (childName) {
        await db.backfillChild(ctx.user.id, childName);
        return db.getChildren(ctx.user.id);
      }

      return existing;
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        avatarColor: z.string().default("coral"),
      }))
      .mutation(async ({ ctx, input }) => {
        const existingChildren = await db.getChildren(ctx.user.id);
        const sortOrder = existingChildren.length;
        try {
          const id = await db.createChild({
            userId: ctx.user.id,
            name: input.name,
            avatarColor: input.avatarColor,
            sortOrder,
          });
          return { id };
        } catch (e: any) {
          if (e?.code === "ER_DUP_ENTRY") {
            throw new TRPCError({ code: "CONFLICT", message: "ילד עם שם זהה כבר קיים" });
          }
          throw e;
        }
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        avatarColor: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        try {
          await db.updateChild(id, ctx.user.id, data);
          return { success: true };
        } catch (e: any) {
          if (e?.code === "ER_DUP_ENTRY") {
            throw new TRPCError({ code: "CONFLICT", message: "ילד עם שם זהה כבר קיים" });
          }
          throw e;
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // לפחות ילד אחד חייב להישאר
        const existing = await db.getChildren(ctx.user.id);
        if (existing.length <= 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "לא ניתן למחוק את הילד האחרון" });
        }
        await db.deleteChild(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  activities: router({
    list: protectedProcedure
      .input(z.object({ childId: optionalChildId }).optional())
      .query(async ({ ctx, input }) => {
        return db.getActivities(ctx.user.id, input?.childId);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        icon: z.string().default("star"),
        color: z.string().default("coral"),
        category: categoryEnum.default("solo"),
        sortOrder: z.number().default(0),
        childId: optionalChildId,
      }))
      .mutation(async ({ ctx, input }) => {
        await assertChildOwnership(input.childId, ctx.user.id);
        const id = await db.createActivity({ ...input, userId: ctx.user.id });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(200).optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        category: categoryEnum.optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateActivity(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteActivity(input.id, ctx.user.id);
        return { success: true };
      }),

    seedDefaults: protectedProcedure
      .input(z.object({ childId: optionalChildId }).optional())
      .mutation(async ({ ctx, input }) => {
        const childId = input?.childId;
        await assertChildOwnership(childId, ctx.user.id);
        const existing = await db.getActivities(ctx.user.id, childId);
        const hasDefaults = existing.some(a => a.isDefault);
        if (hasDefaults) return { seeded: false };

        const defaults = [
          { title: "ציור ויצירה", icon: "palette", color: "coral", category: "solo" as const, sortOrder: 1 },
          { title: "משחק קופסה", icon: "puzzle", color: "sky", category: "solo" as const, sortOrder: 2 },
          { title: "בנייה וקוביות", icon: "blocks", color: "mint", category: "solo" as const, sortOrder: 3 },
          { title: "קריאת ספר", icon: "book", color: "lavender", category: "solo" as const, sortOrder: 4 },
          { title: "האזנה לסיפור", icon: "headphones", color: "peach", category: "solo" as const, sortOrder: 5 },
          { title: "סידור פינה אישית", icon: "home", color: "sun", category: "solo" as const, sortOrder: 6 },
          { title: "אפייה במטבח", icon: "cookie", color: "peach", category: "social" as const, sortOrder: 7 },
          { title: "משחק משותף", icon: "gamepad", color: "sky", category: "social" as const, sortOrder: 8 },
          { title: "יצירה משותפת", icon: "scissors", color: "coral", category: "social" as const, sortOrder: 9 },
          { title: "בישול ביחד", icon: "utensils", color: "sun", category: "social" as const, sortOrder: 10 },
          { title: "ריקוד וקפיצות", icon: "footprints", color: "sun", category: "movement" as const, sortOrder: 11 },
          { title: "יוגה לילדים", icon: "stretch", color: "mint", category: "movement" as const, sortOrder: 12 },
          { title: "משחק בחצר", icon: "sun", color: "sky", category: "movement" as const, sortOrder: 13 },
          { title: "צפייה בסרט", icon: "tv", color: "lavender", category: "screens" as const, sortOrder: 14 },
          { title: "משחק במחשב", icon: "monitor", color: "sky", category: "screens" as const, sortOrder: 15 },
          { title: "שיחת וידאו", icon: "smartphone", color: "mint", category: "screens" as const, sortOrder: 16 },
        ];

        await db.bulkCreateActivities(defaults.map(d => ({ ...d, userId: ctx.user.id, childId, isDefault: true })));
        return { seeded: true };
      }),
  }),

  schedule: router({
    get: protectedProcedure
      .input(z.object({ date: z.string(), childId: optionalChildId }))
      .query(async ({ ctx, input }) => {
        return db.getSchedule(ctx.user.id, input.date, input.childId);
      }),

    save: protectedProcedure
      .input(z.object({
        date: z.string(),
        childId: optionalChildId,
        items: z.array(z.object({
          activityId: z.number(),
          title: z.string(),
          icon: z.string(),
          color: z.string(),
          section: sectionEnum,
          completed: z.boolean().default(false),
          order: z.number(),
        })),
        isCompleted: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertChildOwnership(input.childId, ctx.user.id);
        const id = await db.upsertSchedule({
          userId: ctx.user.id,
          childId: input.childId,
          date: input.date,
          items: input.items,
          isCompleted: input.isCompleted,
        });
        return { id };
      }),

    toggleItem: protectedProcedure
      .input(z.object({
        date: z.string(),
        childId: optionalChildId,
        activityId: z.number(),
        completed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertChildOwnership(input.childId, ctx.user.id);
        const schedule = await db.getSchedule(ctx.user.id, input.date, input.childId);
        if (!schedule) return { success: false, allCompleted: false };
        const items = (schedule.items as any[]).map((item: any) =>
          item.activityId === input.activityId ? { ...item, completed: input.completed } : item
        );
        const allCompleted = items.every((item: any) => item.completed);
        await db.upsertSchedule({
          userId: ctx.user.id,
          childId: input.childId,
          date: input.date,
          items,
          isCompleted: allCompleted,
        });
        return { success: true, allCompleted };
      }),
  }),

  reflection: router({
    get: protectedProcedure
      .input(z.object({ date: z.string(), childId: optionalChildId }))
      .query(async ({ ctx, input }) => {
        return db.getReflection(ctx.user.id, input.date, input.childId);
      }),

    save: protectedProcedure
      .input(z.object({
        date: z.string(),
        childId: optionalChildId,
        enjoyedMost: z.string().optional(),
        hardest: z.string().optional(),
        whatHelped: z.string().optional(),
        tomorrowWish: z.string().optional(),
        mood: z.enum(["great", "good", "okay", "hard", "tough"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertChildOwnership(input.childId, ctx.user.id);
        const id = await db.upsertReflection({
          userId: ctx.user.id,
          childId: input.childId,
          date: input.date,
          enjoyedMost: input.enjoyedMost,
          hardest: input.hardest,
          whatHelped: input.whatHelped,
          tomorrowWish: input.tomorrowWish,
          mood: input.mood,
        });
        return { id };
      }),

    recent: protectedProcedure
      .input(z.object({ limit: z.number().default(7), childId: optionalChildId }))
      .query(async ({ ctx, input }) => {
        return db.getRecentReflections(ctx.user.id, input.limit, input.childId);
      }),
  }),

  tokens: router({
    balance: protectedProcedure
      .input(z.object({ childId: optionalChildId }).optional())
      .query(async ({ ctx, input }) => {
        const balance = await db.getTokenBalance(ctx.user.id, input?.childId);
        return { balance };
      }),

    award: protectedProcedure
      .input(z.object({
        amount: z.number().min(1).max(10),
        reason: z.string().min(1).max(200),
        date: z.string(),
        childId: optionalChildId,
      }))
      .mutation(async ({ ctx, input }) => {
        await assertChildOwnership(input.childId, ctx.user.id);
        // מניעת הענקה כפולה לאותו ילד באותו יום
        const alreadyAwarded = await db.hasTokenEventForDate(ctx.user.id, input.date, input.childId);
        if (alreadyAwarded) {
          return { success: false, alreadyAwarded: true };
        }
        await db.createTokenEvent({
          userId: ctx.user.id,
          childId: input.childId,
          amount: input.amount,
          reason: input.reason,
          date: input.date,
        });
        return { success: true, alreadyAwarded: false };
      }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().default(20), childId: optionalChildId }))
      .query(async ({ ctx, input }) => {
        return db.getTokenEvents(ctx.user.id, input.limit, input.childId);
      }),
  }),

  push: router({
    vapidPublicKey: publicProcedure.query(() => {
      return { key: ENV.vapidPublicKey };
    }),

    subscribe: protectedProcedure
      .input(z.object({
        endpoint: z.string().url(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.savePushSubscription(ctx.user.id, input);
        return { success: true };
      }),

    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePushSubscription(ctx.user.id, input.endpoint);
        return { success: true };
      }),

    test: protectedProcedure.mutation(async ({ ctx }) => {
      const results = await sendPushToUser(ctx.user.id, {
        title: "בדיקה ✅",
        body: "ההתראות עובדות! 🎉",
        url: "/",
        tag: "test",
      });
      return { results };
    }),
  }),

  reminders: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getReminderSettings(ctx.user.id);
      return settings ?? {
        morningEnabled: false,
        morningTime: "08:00",
        eveningEnabled: false,
        eveningTime: "20:00",
        timezone: "Asia/Jerusalem",
      };
    }),

    update: protectedProcedure
      .input(z.object({
        morningEnabled: z.boolean().optional(),
        morningTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
        eveningEnabled: z.boolean().optional(),
        eveningTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
        timezone: z.string().refine((tz) => {
          try { Intl.DateTimeFormat(undefined, { timeZone: tz }); return true; }
          catch { return false; }
        }, { message: "Invalid timezone" }).optional(),
      }).refine((obj) => Object.keys(obj).length > 0, { message: "At least one field is required" }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertReminderSettings(ctx.user.id, input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
