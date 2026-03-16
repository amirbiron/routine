# Changelog — שגרה בחוסר שגרה

> קובץ זה מתעד שינויים פונקציונליים (פיצ'רים, שיפורים, תיקוני באגים) שבוצעו על הפרויקט.
> **לא** כולל את המיגרציה הטכנית מ-Manus ל-Render — רק שינויים שמאנוס יצטרך ליישם על הקודבייס המקורי שלו.
> בסוף תקופת הפיתוח, יש להעביר את הקובץ הזה ל-Manus כדי שייישם את כל השינויים.

---

## [2026-03-16]

### תיקון יצירת ילדים כפולים בניווט אחורה ב-Onboarding
**קבצים:** `client/src/pages/Onboarding.tsx`
**פירוט:** לחיצה על "הבא" בשלב 0, חזרה ל-0 ולחיצה שנייה על "הבא" יצרה ילד כפול + פעילויות כפולות. נוסף guard `createdChildId` שמונע יצירה חוזרת אם הילד כבר נוצר.

### הסרת קוד מת — updateTokenBalance ו-getChild
**קבצים:** `server/db.ts`
**פירוט:** הסרת `updateTokenBalance` — פונקציה שכתבה ל-`users.tokenBalance` שכבר לא נקרא אחרי המעבר לחישוב דינמי מ-tokenEvents. הוסרה גם `getChild` שלא נקראה מאף מקום בקוד. כמו כן הוסרה הקריאה ל-`updateTokenBalance` מתוך `createTokenEvent`.

### תיקון יתרת אסימונים — חישוב per-child במקום גלובלי
**קבצים:** `server/db.ts`, `server/routers.ts`, `client/src/pages/Tokens.tsx`, `server/routers.test.ts`
**פירוט:** יתרת האסימונים הייתה מאוחסנת כערך גלובלי בטבלת `users.tokenBalance`, כך שכל הילדים ראו את אותה יתרה למרות שהיסטוריית האירועים הייתה נפרדת. הוחלף לחישוב דינמי מ-`SUM(tokenEvents.amount)` עם סינון per-child. פונקציה חדשה `getTokenBalance(userId, childId?)` ב-db.ts, הראוטר `tokens.balance` מקבל `childId` אופציונלי, והקליינט מעביר `activeChildId`.

### תיקון באגים בהחלפת ילד פעיל
**קבצים:** `client/src/pages/ScheduleBuilder.tsx`, `client/src/pages/Reflection.tsx`, `client/src/pages/ActivityBank.tsx`
**פירוט:** תיקון 4 באגים שהתגלו בפיצ'ר ריבוי הילדים:
1. **ScheduleBuilder** — `toggleActivity` callback לכד `activeChildId` ישן בגלל שחסר ב-dependency array. נוסף ל-deps.
2. **ScheduleBuilder** — ה-state המקומי (`scheduleItems`) לא התאפס בעת החלפת ילד — הלוח הזמנים הישן נשאר. הוחלף מ-flag `initialized` ל-`useEffect` שמגיב ל-`scheduleKey` ו-`activeChildId`.
3. **Reflection** — `submitted` state לא התאפס בעת מעבר ילד, מה שהציג "כל הכבוד" גם לילד שלא מילא רפלקציה. נוסף `useEffect` שמאפס state.
4. **ActivityBank** — auto-seed רץ עם `childId: undefined` כש-context עוד לא נטען, ויצר פעילויות יתומות. נוסף guard `activeChildId != null` ואיפוס `seedAttempted` בהחלפת ילד.

### תמיכה בריבוי ילדים לחשבון הורה אחד
**קבצים:** `drizzle/schema.ts`, `drizzle/0003_add_children_table.sql`, `server/db.ts`, `server/routers.ts`, `client/src/contexts/ChildContext.tsx`, `client/src/components/ChildSelector.tsx`, `client/src/components/AppHeader.tsx`, `client/src/pages/ChildrenManager.tsx`, `client/src/pages/Onboarding.tsx`, `client/src/pages/Home.tsx`, `client/src/pages/ScheduleBuilder.tsx`, `client/src/pages/ActivityBank.tsx`, `client/src/pages/Reflection.tsx`, `client/src/pages/Tokens.tsx`, `client/src/App.tsx`
**פירוט:** הוספת טבלת `children` חדשה שמאפשרת להורה אחד לנהל כמה ילדים עם מייל הרשמה אחד. כל ילד מקבל מאגר פעילויות, לוח זמנים, רפלקציות ואסימונים נפרדים. שינויים עיקריים:
- **DB:** טבלת `children` (id, userId, name, avatarColor, sortOrder). עמודת `childId` nullable נוספה ל-`activities`, `schedules`, `reflections`, `tokenEvents`. מיגרציית SQL מעבירה נתונים קיימים.
- **Server:** ראוטר `children` חדש (list/create/update/delete). כל הראוטרים הקיימים (activities, schedule, reflection, tokens) מקבלים `childId` אופציונלי ומסננים לפיו. פונקציות DB עודכנו בהתאם.
- **Client:** `ChildContext` + `useActiveChild` hook — שומר את הילד הפעיל ב-localStorage. `ChildSelector` ב-header מאפשר מעבר בין ילדים. דף `ChildrenManager` לניהול ילדים (הוספה/עריכה/מחיקה). Onboarding יוצר רשומת ילד + seed פעילויות. כל הדפים (ScheduleBuilder, ActivityBank, Reflection, Tokens, Home) עודכנו להעביר `childId` לשאילתות.
- **תאימות אחורה:** `childId` הוא nullable — משתמשים קיימים ממשיכים לעבוד. המיגרציה יוצרת ילד ברירת מחדל למשתמשים קיימים ומקשרת את הנתונים שלהם.

---

## [2026-03-11]

### תיקון VAPID subject — הוספת mailto: אוטומטית
**קבצים:** `server/_core/env.ts`
**פירוט:** כש-`VAPID_EMAIL` מוגדר ב-env בלי קידומת `mailto:` (למשל `amirbiron@gmail.com`), web-push זורק שגיאה "Vapid subject is not a valid URL" והתראות push מושבתות. הוספנו נורמליזציה אוטומטית שמוסיפה `mailto:` אם חסר.

### מניעת עדכון ריק בהגדרות תזכורות
**קבצים:** `server/routers.ts`
**פירוט:** הוספת `refine` לסכמת הקלט של `reminders.update` שדורש לפחות שדה אחד. בלי זה, אובייקט ריק `{}` עובר ולידציה אבל גורם ל-SQL לא תקין ב-`onDuplicateKeyUpdate({ set: {} })`.

### תיקון race condition ב-mutations של תזכורות והסרת קוד מת
**קבצים:** `client/src/pages/Reminders.tsx`, `server/pushScheduler.ts`
**פירוט:** (1) ב-`handleMorningTimeChange` ו-`handleEveningTimeChange` — ה-mutation שלח רק את השעה בלי `enabled`, מה שגרם ל-race condition עם mutation של toggle. עכשיו שולחים גם `morningEnabled`/`eveningEnabled` כדי שה-upsert ישמור את כל השדות הרלוונטיים גם אם הבקשות מגיעות בסדר שונה. (2) הסרת משתנה `schedulerInterval` שהפך לקוד מת אחרי הסרת `stopPushScheduler`.

### תיקון קריסת שרת ב-initWebPush והסרת קוד מת
**קבצים:** `server/pushScheduler.ts`
**פירוט:** (1) עטיפת `webpush.setVapidDetails` ב-try-catch — מפתחות VAPID פגומים גרמו ל-exception לא נתפס שהפיל את כל השרת. עכשיו push notifications מושבתות בחינניות והשרת ממשיך לעבוד. (2) הסרת `stopPushScheduler` — פונקציה שלא נקראה מאף מקום בקוד.

### תיקון ולידציית שעה בתזכורות
**קבצים:** `server/routers.ts`
**פירוט:** הרגקס לולידציית morningTime ו-eveningTime קיבל ערכים לא תקינים כמו "99:99". הוחלף ב-regex שמוודא טווח שעות 00-23 ודקות 00-59, כך שערך לא תקין לא יישמר ב-DB ולא ישתק תזכורות.

### תיקוני באגים — UI תזכורות וולידציית timezone
**קבצים:** `client/src/pages/Reminders.tsx`, `server/routers.ts`
**פירוט:** שלושה תיקונים: (1) העברת הצהרת `utils` לפני `updateMutation` למניעת תלות בסדר הצהרות שברירה. (2) הוספת `onError` handler ל-mutation שמשחזר את מצב ה-toggles מהשרת ומציג הודעת שגיאה — מונע מצב שבו ה-UI מראה תזכורת מופעלת אבל השרת לא שמר. (3) הוספת ולידציית timezone עם `Intl.DateTimeFormat` ב-route של עדכון תזכורות — מונע שמירת timezone לא תקין שגורם ל-RangeError בלולאת ה-scheduler.

### תיקוני באגים נוספים — push notifications ו-reminder settings
**קבצים:** `server/pushScheduler.ts`, `client/src/_core/hooks/usePushNotifications.ts`, `drizzle/schema.ts`, `server/db.ts`
**פירוט:** שלושה תיקונים: (1) פונקציית pruneLastSentMap השתמשה בתאריך UTC של השרת, אבל הערכים ב-map נשמרו בתאריך המקומי של המשתמש — עכשיו שומרים רשומות מהיום ומאתמול כדי למנוע מחיקה מוקדמת עבור משתמשים ב-timezone מקדים ל-UTC. (2) ב-usePushNotifications, סגירת דיאלוג ההרשאות בלי בחירה (permission="default") סימנה בטעות "denied" — עכשיו מבחינים בין "denied" ל-"default" כך שהמשתמש יכול לנסות שוב. (3) הוספת unique constraint על userId בטבלת reminderSettings והחלפת ה-upsert הלא-אטומי (select-then-insert) ב-onDuplicateKeyUpdate אטומי למניעת שורות כפולות ב-race condition.

### תיקון באגים ב-pushScheduler
**קבצים:** `server/pushScheduler.ts`
**פירוט:** שני תיקונים: (1) החלפת `hour12: false` ב-`hourCycle: "h23"` בפורמט השעה — מונע מצב שבו חצות מוצגת כ-"24:00" במקום "00:00" בחלק ממימושי Node.js/ICU, מה שגרם לכך שתזכורות שנקבעו לחצות לא נשלחו. (2) הוספת פונקציית `pruneLastSentMap` שמנקה רשומות ישנות מה-dedup map בכל מחזור בדיקה — פותר דליפת זיכרון כי ה-Map גדל ללא הגבלה לאורך חיי השרת.

### תזכורות Push יומיות (בוקר וערב)
**קבצים:** `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts`, `server/pushScheduler.ts`, `server/_core/index.ts`, `server/_core/env.ts`, `client/public/sw.js`, `client/src/_core/hooks/usePushNotifications.ts`, `client/src/pages/Reminders.tsx`, `client/src/App.tsx`, `client/src/components/AppHeader.tsx`, `package.json`
**פירוט:** מימוש מערכת תזכורות Push מלאה. נוספו שתי טבלאות חדשות: `pushSubscriptions` (שמירת subscription של הדפדפן) ו-`reminderSettings` (הגדרות תזכורת בוקר/ערב לכל משתמש עם timezone). נוסף Service Worker (`sw.js`) לקבלת התראות push והצגתן גם כשהאפליקציה סגורה — לחיצה על ההתראה פותחת את העמוד הרלוונטי. בצד השרת: scheduler שרץ כל 60 שניות ובודק מי צריך לקבל תזכורת לפי השעה ב-timezone שלו, ומשתמש ב-Web Push API עם VAPID keys. נוספו routes ב-tRPC: שמירת/ביטול subscription, שליחת push בדיקה, וקריאה/עדכון הגדרות תזכורות. בצד הקליינט: hook `usePushNotifications` שמנהל את ה-SW registration, בקשת הרשאות, ושמירת subscription בשרת. דף הגדרות `Reminders.tsx` עם toggles לתזכורת בוקר (ברירת מחדל 08:00) וערב (20:00), בחירת שעה, כפתור שליחת בדיקה, והודעות שגיאה למקרה שהדפדפן לא תומך או שההרשאה נחסמה. נוסף אייקון פעמון בהדר לגישה מהירה לדף התזכורות. נדרשים env vars חדשים: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`.
