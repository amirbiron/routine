# Changelog — שגרה בחוסר שגרה

> קובץ זה מתעד שינויים פונקציונליים (פיצ'רים, שיפורים, תיקוני באגים) שבוצעו על הפרויקט.
> **לא** כולל את המיגרציה הטכנית מ-Manus ל-Render — רק שינויים שמאנוס יצטרך ליישם על הקודבייס המקורי שלו.
> בסוף תקופת הפיתוח, יש להעביר את הקובץ הזה ל-Manus כדי שייישם את כל השינויים.

---

## [2026-03-11]

### תזכורות Push יומיות (בוקר וערב)
**קבצים:** `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts`, `server/pushScheduler.ts`, `server/_core/index.ts`, `server/_core/env.ts`, `client/public/sw.js`, `client/src/_core/hooks/usePushNotifications.ts`, `client/src/pages/Reminders.tsx`, `client/src/App.tsx`, `client/src/components/AppHeader.tsx`, `package.json`
**פירוט:** מימוש מערכת תזכורות Push מלאה. נוספו שתי טבלאות חדשות: `pushSubscriptions` (שמירת subscription של הדפדפן) ו-`reminderSettings` (הגדרות תזכורת בוקר/ערב לכל משתמש עם timezone). נוסף Service Worker (`sw.js`) לקבלת התראות push והצגתן גם כשהאפליקציה סגורה — לחיצה על ההתראה פותחת את העמוד הרלוונטי. בצד השרת: scheduler שרץ כל 60 שניות ובודק מי צריך לקבל תזכורת לפי השעה ב-timezone שלו, ומשתמש ב-Web Push API עם VAPID keys. נוספו routes ב-tRPC: שמירת/ביטול subscription, שליחת push בדיקה, וקריאה/עדכון הגדרות תזכורות. בצד הקליינט: hook `usePushNotifications` שמנהל את ה-SW registration, בקשת הרשאות, ושמירת subscription בשרת. דף הגדרות `Reminders.tsx` עם toggles לתזכורת בוקר (ברירת מחדל 08:00) וערב (20:00), בחירת שעה, כפתור שליחת בדיקה, והודעות שגיאה למקרה שהדפדפן לא תומך או שההרשאה נחסמה. נוסף אייקון פעמון בהדר לגישה מהירה לדף התזכורות. נדרשים env vars חדשים: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`.
