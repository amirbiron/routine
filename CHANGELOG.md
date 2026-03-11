# Changelog — שגרה בחוסר שגרה

> קובץ זה מתעד את כל השינויים שבוצעו על הפרויקט מאז ההעברה מ-Manus ל-Render.
> בסוף תקופת הפיתוח, יש להעביר את הקובץ הזה ל-Manus כדי שייישם את כל השינויים על הקודבייס המקורי.

---

## [2026-03-11]

### מעבר מ-Manus OAuth לאימות עצמאי עם אימייל+סיסמה, והתאמה ל-Render

**קבצים שנוספו:**
- `render.yaml` — הגדרות web service ל-Render (build, start, env vars)
- `CLAUDE.md` — תיאור ארכיטקטורה והנחיות עבודה
- `client/src/pages/Login.tsx` — דף כניסה/הרשמה עם אימייל+סיסמה (ממשק בעברית)
- `drizzle/0002_add_password_hash.sql` — מיגרציית DB: עמודת passwordHash, unique על email, openId nullable
- `scripts/set-admin.ts` — סקריפט CLI להענקת הרשאת admin למשתמש לפי אימייל

**קבצים שנמחקו:**
- `server/_core/types/manusTypes.ts` — טיפוסי TypeScript של OAuth של Manus (כולל ExchangeToken, GetUserInfo וכו')
- `client/src/components/ManusDialog.tsx` — דיאלוג "Login with Manus"
- `client/public/__manus__/debug-collector.js` — סקריפט debug של Manus
- `.manus/db/*` — קבצי DB query ישנים של Manus
- `vite.config.ts.bak` — גיבוי ישן

**קבצים ששונו:**

| קובץ | מה השתנה |
|-------|----------|
| `server/_core/sdk.ts` | הוחלף לחלוטין: במקום `OAuthService` + `SDKServer` שעבדו מול Manus OAuth — עכשיו `AuthService` פשוט שמשתמש ב-scrypt מובנה של Node.js ל-hashing סיסמאות, ו-JWT signing/verify עם jose |
| `server/_core/oauth.ts` | הוחלף לחלוטין: במקום route של `/api/oauth/callback` — עכשיו שני routes: `POST /api/auth/signup` ו-`POST /api/auth/login` עם validation ב-zod |
| `server/_core/env.ts` | הוסרו: `appId`, `oAuthServerUrl`, `ownerOpenId` — נשארו רק `cookieSecret`, `databaseUrl`, `isProduction`, `forgeApiUrl`, `forgeApiKey` |
| `server/_core/index.ts` | שונה import מ-`registerOAuthRoutes` ל-`registerAuthRoutes` |
| `server/_core/cookies.ts` | `sameSite` שונה מ-`"none"` ל-`"lax"` (כי אנחנו כבר לא cross-origin), הוסרו פונקציות עזר שלא נחוצות |
| `server/db.ts` | הוסרו: `upsertUser` (שכלל auto-admin לפי `OWNER_OPEN_ID`), `getUserByOpenId`. נוספו: `createUser` (INSERT ישיר, בלי upsert), `getUserByEmail`, `getUserById`, `touchLastSignedIn`, `sanitizeUser` (מסיר passwordHash לפני החזרה ל-client). נוסף auto-SSL לחיבורי DB בענן |
| `server/routers.ts` | `auth.me` עכשיו מחזיר `sanitizeUser(user)` במקום את ה-user ישירות (מונע חשיפת passwordHash) |
| `drizzle/schema.ts` | עמודת `openId` שונתה מ-`notNull().unique()` ל-nullable. נוספה עמודת `passwordHash` (text, nullable). `email` קיבלה `.unique()` |
| `drizzle/meta/_journal.json` | נוספה אנטרי למיגרציה 0002 |
| `client/src/const.ts` | `getLoginUrl()` שונתה מ-URL חיצוני של Manus OAuth ל-`"/login"` פשוט |
| `client/src/App.tsx` | נוסף import של Login ונוסף route `/login` |
| `client/src/_core/hooks/useAuth.ts` | הוסרה שמירה ל-localStorage של `manus-runtime-user-info` |
| `client/src/components/AppHeader.tsx` | כפתור כניסה שונה מ-`<a href>` ל-`<Link href>` (ניווט פנימי) |
| `client/src/components/DashboardLayout.tsx` | כפתור Sign in שונה מ-`window.location.href` ל-`<WouterLink>` |
| `client/src/pages/Home.tsx` | כפתור "בואו נתחיל" שונה מ-`<a>` ל-`<Link>` |
| `vite.config.ts` | הוסרו: `vite-plugin-manus-runtime`, `vitePluginManusDebugCollector`, `@builder.io/vite-plugin-jsx-loc`, רשימת `allowedHosts` של Manus |
| `package.json` | הוסר: `axios`, `vite-plugin-manus-runtime`, `@builder.io/vite-plugin-jsx-loc`. נוסף: script `set-admin` |
| `shared/const.ts` | הוסר `AXIOS_TIMEOUT_MS` |
| `server/storage.ts` | הוסר קומנט "Manus WebDev templates" |
| `server/_core/notification.ts` | הוסר קומנט "Manus" |
| `server/_core/llm.ts` | הוסר fallback URL של `forge.manus.im` — עכשיו זורק שגיאה אם `BUILT_IN_FORGE_API_URL` לא מוגדר |
| `server/_core/map.ts` | הוסר קומנט "Manus WebDev Templates" |
| `server/_core/dataApi.ts` | הוסר קומנט "manus" מדוגמה |
| `.gitignore` | נוספו `.manus/`, `.manus-logs/` |
| `server/routers.test.ts` | עודכן לסכמה החדשה (passwordHash, openId nullable) |
| `server/auth.logout.test.ts` | עודכן `sameSite` מ-`"none"` ל-`"lax"`, הוספו שדות חסרים |

**פירוט:**
המערכת עברה מאימות OAuth חיצוני דרך Manus (שכלל ExchangeToken, GetUserInfo, redirect callback) לאימות עצמאי מלא עם אימייל+סיסמה. הסיסמאות מוצפנות עם scrypt מובנה של Node.js (crypto.scrypt). הסשן נשמר ב-JWT cookie עם jose. הוסרו כל התלויות והקוד של Manus (OAuth, debug collector, runtime plugin). הוספו הגנות אבטחה: unique constraint על email, הסרת passwordHash מתגובות API, INSERT ישיר במקום upsert (מניעת דריסת משתמש קיים), הגנה מ-crash כש-password hash פגום. מנגנון auto-admin לפי OWNER_OPEN_ID הוחלף בסקריפט ידני `pnpm set-admin`. חיבור DB מקבל SSL אוטומטי כשמחובר לענן.

**env vars שהוסרו (לא צריך יותר):** `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`

**env vars נדרשים ב-Render:** `DATABASE_URL`, `JWT_SECRET`, `PORT` (אופציונלי, ברירת מחדל 3000)
