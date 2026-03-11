# Changelog — שגרה בחוסר שגרה

> קובץ זה מתעד שינויים פונקציונליים (פיצ'רים, שיפורים, תיקוני באגים) שבוצעו על הפרויקט.
> **לא** כולל את המיגרציה הטכנית מ-Manus ל-Render — רק שינויים שמאנוס יצטרך ליישם על הקודבייס המקורי שלו.
> בסוף תקופת הפיתוח, יש להעביר את הקובץ הזה ל-Manus כדי שייישם את כל השינויים.

---

## [2026-03-11]

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
