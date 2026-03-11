import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

const categoryEnum = z.enum(["solo", "social", "movement", "screens"]);
const sectionEnum = z.enum(["morning", "afternoon", "evening"]);

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ? db.sanitizeUser(opts.ctx.user) : null),
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

  activities: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getActivities(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        icon: z.string().default("star"),
        color: z.string().default("coral"),
        category: categoryEnum.default("solo"),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
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

    seedDefaults: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await db.getActivities(ctx.user.id);
      // Only skip seeding if user has real (non-test) default activities
      const hasDefaults = existing.some(a => a.isDefault);
      if (hasDefaults) return { seeded: false };

      const defaults = [
        // פעילויות שאני עושה עם עצמי
        { title: "ציור ויצירה", icon: "palette", color: "coral", category: "solo" as const, sortOrder: 1 },
        { title: "משחק קופסה", icon: "puzzle", color: "sky", category: "solo" as const, sortOrder: 2 },
        { title: "בנייה וקוביות", icon: "blocks", color: "mint", category: "solo" as const, sortOrder: 3 },
        { title: "קריאת ספר", icon: "book", color: "lavender", category: "solo" as const, sortOrder: 4 },
        { title: "האזנה לסיפור", icon: "headphones", color: "peach", category: "solo" as const, sortOrder: 5 },
        { title: "סידור פינה אישית", icon: "home", color: "sun", category: "solo" as const, sortOrder: 6 },
        // פעילויות שאני עושה עם המשפחה/חברים
        { title: "אפייה במטבח", icon: "cookie", color: "peach", category: "social" as const, sortOrder: 7 },
        { title: "משחק משותף", icon: "gamepad", color: "sky", category: "social" as const, sortOrder: 8 },
        { title: "יצירה משותפת", icon: "scissors", color: "coral", category: "social" as const, sortOrder: 9 },
        { title: "בישול ביחד", icon: "utensils", color: "sun", category: "social" as const, sortOrder: 10 },
        // פעילות בתנועה
        { title: "ריקוד וקפיצות", icon: "footprints", color: "sun", category: "movement" as const, sortOrder: 11 },
        { title: "יוגה לילדים", icon: "stretch", color: "mint", category: "movement" as const, sortOrder: 12 },
        { title: "משחק בחצר", icon: "sun", color: "sky", category: "movement" as const, sortOrder: 13 },
        // פעילות עם מסכים
        { title: "צפייה בסרט", icon: "tv", color: "lavender", category: "screens" as const, sortOrder: 14 },
        { title: "משחק במחשב", icon: "monitor", color: "sky", category: "screens" as const, sortOrder: 15 },
        { title: "שיחת וידאו", icon: "smartphone", color: "mint", category: "screens" as const, sortOrder: 16 },
      ];

      await db.bulkCreateActivities(defaults.map(d => ({ ...d, userId: ctx.user.id, isDefault: true })));
      return { seeded: true };
    }),
  }),

  schedule: router({
    get: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getSchedule(ctx.user.id, input.date);
      }),

    save: protectedProcedure
      .input(z.object({
        date: z.string(),
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
        const id = await db.upsertSchedule({
          userId: ctx.user.id,
          date: input.date,
          items: input.items,
          isCompleted: input.isCompleted,
        });
        return { id };
      }),

    toggleItem: protectedProcedure
      .input(z.object({
        date: z.string(),
        activityId: z.number(),
        completed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const schedule = await db.getSchedule(ctx.user.id, input.date);
        if (!schedule) return { success: false };
        const items = (schedule.items as any[]).map((item: any) =>
          item.activityId === input.activityId ? { ...item, completed: input.completed } : item
        );
        const allCompleted = items.every((item: any) => item.completed);
        await db.upsertSchedule({
          userId: ctx.user.id,
          date: input.date,
          items,
          isCompleted: allCompleted,
        });
        return { success: true, allCompleted };
      }),
  }),

  reflection: router({
    get: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getReflection(ctx.user.id, input.date);
      }),

    save: protectedProcedure
      .input(z.object({
        date: z.string(),
        enjoyedMost: z.string().optional(),
        hardest: z.string().optional(),
        whatHelped: z.string().optional(),
        tomorrowWish: z.string().optional(),
        mood: z.enum(["great", "good", "okay", "hard", "tough"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createReflection({
          userId: ctx.user.id,
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
      .input(z.object({ limit: z.number().default(7) }))
      .query(async ({ ctx, input }) => {
        return db.getRecentReflections(ctx.user.id, input.limit);
      }),
  }),

  tokens: router({
    balance: protectedProcedure.query(async ({ ctx }) => {
      return { balance: ctx.user.tokenBalance || 0 };
    }),

    award: protectedProcedure
      .input(z.object({
        amount: z.number().min(1).max(10),
        reason: z.string().min(1).max(200),
        date: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createTokenEvent({
          userId: ctx.user.id,
          amount: input.amount,
          reason: input.reason,
          date: input.date,
        });
        return { success: true };
      }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        return db.getTokenEvents(ctx.user.id, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
