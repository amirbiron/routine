# Changelog — שגרה בחוסר שגרה

> קובץ זה מתעד שינויים פונקציונליים (פיצ'רים, שיפורים, תיקוני באגים) שבוצעו על הפרויקט.
> **לא** כולל את המיגרציה הטכנית מ-Manus ל-Render — רק שינויים שמאנוס יצטרך ליישם על הקודבייס המקורי שלו.
> בסוף תקופת הפיתוח, יש להעביר את הקובץ הזה ל-Manus כדי שייישם את כל השינויים.

---

## [2026-03-16]

### תיקון: טיפול בשגיאת שם כפול ביצירה/עדכון ילד + הסרת קוד מת
**קבצים:** `server/routers.ts`, `server/db.ts`
**פירוט:** האינדקס הייחודי `(userId, name)` שנוסף לטבלת children גרם ל-500 כשמשתמש ניסה ליצור או לשנות שם ילד לשם שכבר קיים. הוספה תפיסת שגיאת `ER_DUP_ENTRY` ב-`children.create` ו-`children.update` שמחזירה שגיאת CONFLICT ברורה ללקוח. בנוסף, הוסרה הפונקציה `linkOrphanDataToChild` שהפכה לקוד מת אחרי שהלוגיקה שלה נבלעה לתוך `backfillChild`.

### תיקון: race condition ו-backfill לא-אטומי ביצירת ילד אוטומטית
**קבצים:** `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts`
**פירוט:** תוקנו שני באגים ב-backfill של טבלת children: (1) Race condition — כשכמה בקשות מגיעות במקביל (retry של react-query, כמה טאבים), כולן רואות 0 ילדים ויוצרות כפילויות. הפתרון: אינדקס ייחודי על `(userId, name)` בטבלת children + שימוש ב-`INSERT IGNORE` שמתעלם מכפילויות. (2) Non-atomic backfill — `createChild` ו-`linkOrphanDataToChild` רצו בנפרד, כך שאם הקישור נכשל הנתונים היתומים נתקעים לצמיתות. הפתרון: פונקציה חדשה `backfillChild` שעוטפת הכל בטרנזקציה אחת.

### תיקון: ChildSelector לא מוצג למשתמשים ישנים — backfill אוטומטי של טבלת children
**קבצים:** `server/routers.ts`, `server/db.ts`
**פירוט:** משתמשים שנרשמו לפני הוספת פיצ'ר ריבוי ילדים היו עם `childName` בטבלת `users` אבל בלי רשומה בטבלת `children`. כתוצאה, `children.list` החזיר מערך ריק ו-ChildSelector לא הוצג כלל. הפתרון: backfill אוטומטי ב-`children.list` — אם אין ילדים אבל יש `childName`, נוצרת רשומת ילד אוטומטית. בנוסף, כל הנתונים הקיימים (פעילויות, לוחות זמנים, רפלקציות, אסימונים) עם `childId=NULL` משויכים לילד החדש דרך פונקציית `linkOrphanDataToChild`.

### תיקון: שאילתות schedule ו-recentReflections חסרות בדיקת isNull — דריסת נתונים בין ילדים
**קבצים:** `server/db.ts`
**פירוט:** `getSchedule` לא הוסיף `isNull(schedules.childId)` כש-childId לא מוגדר — כך `upsertSchedule` יכול היה להתאים ולדרוס לוז של ילד ספציפי. אותה בעיה בדיוק תוקנה קודם ב-`upsertReflection` אבל לא הוחלה על הנתיב של schedule. תוקן גם ב-`getRecentReflections` שסבל מאותו חוסר.

### תיקון: Onboarding לא מגדיר ילד פעיל אחרי יצירה + upsert רפלקציה עלול לדרוס ילד אחר
**קבצים:** `client/src/pages/Onboarding.tsx`, `server/db.ts`
**פירוט:** שני תיקונים:
1. ב-Onboarding, אחרי יצירת ילד חדש לא נקרא `setActiveChildId` — כל השאילתות הראשונות רצו עם `childId: undefined`. נוסף `setActiveChildId(result.id)` מיד אחרי יצירה, ו-`refetch()` הפך ל-`await refetch()` כדי שה-context יתעדכן לפני `onComplete()`.
2. ב-`upsertReflection`, כש-`childId` הוא `undefined` השאילתה לא סיננה לפי childId — וזה יכול לדרוס רפלקציה של ילד אחר באותו תאריך. נוסף תנאי `isNull(reflections.childId)` כשאין childId, כך שההתאמה תמיד מדויקת.

### תיקון: כשל ב-seed חוסם סגירת דיאלוג והפעלת ילד חדש
**קבצים:** `client/src/pages/ChildrenManager.tsx`
**פירוט:** ב-`handleSave`, קריאת `seedMutation.mutateAsync` לא הייתה עטופה ב-try-catch. אם ה-seed נכשל, `setActiveChildId` ו-`setDialogOpen(false)` לא הגיעו לביצוע — הדיאלוג נשאר פתוח והילד החדש לא הוגדר כפעיל. עטפנו ב-try-catch בהתאמה לדפוס הקיים ב-Onboarding, כי ActivityBank מנסה seed אוטומטית.

### תיקון: רפלקציה יוצרת שורות כפולות במקום עדכון
**קבצים:** `server/db.ts`, `server/routers.ts`
**פירוט:** `reflection.save` קרא ל-`createReflection` (INSERT) בכל שמירה, מה שיצר שורות כפולות לאותו user+date+child. הוחלף ב-`upsertReflection` שבודק אם כבר קיימת רפלקציה ומעדכן אותה במקום ליצור חדשה.

### תיקון: toggleItem מחזיר תשובה לא עקבית כשאין לוח זמנים
**קבצים:** `server/routers.ts`
**פירוט:** `schedule.toggleItem` החזיר `{ success: false }` ללא שדה `allCompleted` כשלא נמצא לוח זמנים. הלקוח ניגש ל-`result.allCompleted` שהיה `undefined`. נוסף `allCompleted: false` לתשובה.

### תיקון: מחיקת ילד אחרון זורקת Error רגיל במקום TRPCError
**קבצים:** `server/routers.ts`
**פירוט:** `children.delete` זרק `new Error()` שגרם ל-tRPC להחזיר 500 INTERNAL_SERVER_ERROR. הוחלף ב-`TRPCError({ code: "BAD_REQUEST" })` כדי שהלקוח יקבל שגיאה ברורה עם קוד 400.

### תיקון: auto-seed פעילויות רץ בזמן render במקום ב-effect
**קבצים:** `client/src/pages/ActivityBank.tsx`
**פירוט:** לוגיקת ה-auto-seed הפעילה `setSeedAttempted` ו-`seedMutation.mutate` ישירות בגוף הרנדור של הקומפוננטה, מה שגורם ל-React להזהיר על עדכון state בזמן render. הועבר ל-`useEffect`.

### תיקון: מחיקת ילד פעיל משאירה activeChildId לא תקין
**קבצים:** `client/src/pages/ChildrenManager.tsx`
**פירוט:** כשמוחקים את הילד הנוכחי, `activeChildId` נשאר על ה-ID שנמחק עד שה-refetch חוזר. נוסף מעבר לילד אחר לפני ביצוע המחיקה, כך ש-localStorage ו-context מתעדכנים מיד.

### אבטחה: בדיקת בעלות על childId במוטציות בצד השרת
**קבצים:** `server/db.ts`, `server/routers.ts`
**פירוט:** כל המוטציות שמקבלות `childId` מהלקוח (activities.create, activities.seedDefaults, schedule.save, schedule.toggleItem, reflection.save, tokens.award) לא אימתו שה-childId שייך למשתמש המחובר. נוספה פונקציית `verifyChildOwnership` ב-db.ts ו-`assertChildOwnership` ב-routers.ts שזורקת TRPCError FORBIDDEN אם הילד לא שייך למשתמש. הבדיקה מופעלת בתחילת כל מוטציה — רק אם childId מסופק (undefined עובר בלי בדיקה לתאימות אחורה).

### תיקון: רפלקציה לא מתעדכנת ב-cache אחרי שמירה
**קבצים:** `client/src/pages/Reflection.tsx`
**פירוט:** ה-`onSuccess` של `reflection.save` לא ביצע `invalidate()` על `reflection.get` ו-`reflection.recent`. כשמשתמש שמר רפלקציה לילד א', עבר לילד ב' וחזר — הקאש הישן הציג טופס ריק במקום תצוגת ההצלחה. נוספו `utils.reflection.get.invalidate()` ו-`utils.reflection.recent.invalidate()`.

### תיקון: לוח זמנים ריק בהחלפת ילדים עם אותו updatedAt
**קבצים:** `client/src/pages/ScheduleBuilder.tsx`
**פירוט:** ה-effect לאתחול לוח הזמנים תלוי ב-`scheduleVersion` (מ-`updatedAt`), אבל לא ב-`activeChildId`. כששני ילדים חולקים אותו `updatedAt`, ה-effect לא רץ מחדש אחרי החלפת ילד — והמשתמש רואה לוח ריק. נוסף `activeChildId` למערך ה-dependencies של ה-effect.

### תיקון: refetch אחרי toggle דורס שינויים מקומיים שלא נשמרו בלוח הזמנים
**קבצים:** `client/src/pages/ScheduleBuilder.tsx`
**פירוט:** כאשר המשתמש הוסיף/מחק/גרר פעילויות ואז סימן פעילות כהושלמה (toggle), ה-`onSuccess` של `toggleMutation` הפעיל `invalidate()` שגרם ל-effect לדרוס את השינויים המקומיים שלא נשמרו. נוסף דגל `dirty` שנדלק בהוספה (`addActivity`), מחיקה (`removeActivity`) וגרירה (`handleDragEnd`), ומונע מה-effect לסנכרן מהשרת כל עוד יש שינויים מקומיים. הדגל מתאפס בשמירה מוצלחת (`saveMutation.onSuccess`) ובהחלפת ילד פעיל.

### תיקון: אנימציית חגיגה מופעלת גם כשהענקת אסימונים נדחית
**קבצים:** `client/src/pages/Tokens.tsx`
**פירוט:** ה-callback `onSuccess` של mutation הענקת אסימונים הפעיל `setCelebrating(true)` ללא תנאי, גם כשהשרת החזיר `alreadyAwarded: true`. המשתמש ראה חגיגה + הודעת שגיאה בו-זמנית. הועבר הלוגיקה (celebration + invalidation + toast) מ-`onSuccess` לתוך `handleAward` — רק אחרי בדיקת `alreadyAwarded`.

### תיקוני באגים: סנכרון לוח זמנים, seed ב-onboarding, הענקת אסימונים כפולה
**קבצים:** `client/src/pages/ScheduleBuilder.tsx`, `client/src/pages/Onboarding.tsx`, `server/db.ts`, `server/routers.ts`, `client/src/pages/Tokens.tsx`
**פירוט:** (1) **ScheduleBuilder** — ה-effect לאתחול scheduleItems השתמש ב-`existingSchedule.id` כ-key, שלא משתנה כשפריטים מתעדכנים (toggleItem). הוחלף ל-`updatedAt` שמשתנה בכל upsert. (2) **Onboarding** — אם seedActivities נכשל אחרי שהילד כבר נוצר, ה-catch block חסם התקדמות ו-seed לא נוסה שנית (כי createdChildId כבר מלא). עכשיו seed עטוף ב-try/catch נפרד — כישלון seed לא חוסם, ו-ActivityBank ינסה שוב אוטומטית. (3) **Tokens** — לא הייתה מניעה של הענקה כפולה לאותו ילד+יום. נוספה פונקציה `hasTokenEventForDate` שמונעת יצירת אירוע כפול בצד השרת, ומציגה הודעה מתאימה בקליינט.

### תיקון: Onboarding לא מתקדם ללא יצירת ילד + race condition ברפלקציה
**קבצים:** `client/src/pages/Onboarding.tsx`, `client/src/pages/Reflection.tsx`
**פירוט:** (1) **Onboarding** — אם יצירת ילד נכשלה בשלב 0, ה-catch block עדיין התקדם לשלב הבא. המשתמש היה מסיים onboarding בלי רשומת ילד, והאפליקציה נשברת כי `ChildSelector` מחזיר null. עכשיו שלב 0 חוסם התקדמות בכשלון ומציג הודעת שגיאה. (2) **Reflection** — אם המשתמש שלח רפלקציה והחליף ילד לפני שה-mutation הסתיים, `onSuccess` הפעיל `setSubmitted(true)` אחרי שה-`useEffect` כבר איפס אותו — מה שהציג "כל הכבוד" לילד הלא נכון. נוסף `submittedForChildRef` שמוודא שה-callback רק מסמן submitted אם ה-childId הפעיל עדיין תואם.

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
