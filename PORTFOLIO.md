---
# Portfolio – Routine Anchors (שגרה בחוסר שגרה)

name: "Routine Anchors – שגרה בחוסר שגרה"
repo: "https://github.com/amirbiron/routine"
status: "פעיל"

one_liner: "כלי אינטראקטיבי לבניית עוגני שגרה יומיים לילדים בתקופות של חוסר ודאות"

stack:
  - TypeScript
  - React 19
  - Vite 7
  - Tailwind CSS 4
  - Express
  - tRPC
  - Drizzle ORM
  - MySQL
  - JWT (jose)
  - Framer Motion
  - Radix UI
  - AWS S3 (אחסון קבצים)
  - Web Push notifications
  - pnpm

key_features:
  - בניית שגרה יומית אינטראקטיבית לילדים
  - Drag-and-Drop לסידור פעילויות (@dnd-kit)
  - אימות משתמשים (email + password, JWT בcookies)
  - Push notifications (Web Push)
  - תמיכה RTL מלאה (עברית)
  - ממשק משתמש עשיר עם Radix UI + Framer Motion
  - גרפים ואנליטיקה (Recharts)
  - ניהול אדמין (set-admin script)
  - Dark mode

architecture:
  summary: |
    Full-stack TypeScript application:
    - Client: React 19 SPA עם Vite, Tailwind CSS, Radix UI
    - Server: Express + tRPC עם type-safety מלא
    - Database: MySQL עם Drizzle ORM ו-migrations
    - Auth: JWT בHTTP-only cookies עם scrypt hashing
    - State: TanStack React Query
  entry_points:
    - server/_core/index.ts – שרת Express + tRPC
    - client/src/ – React SPA
    - shared/ – טיפוסים וקונסטנטות משותפים
    - drizzle/ – סכמת DB ומיגרציות

demo:
  live_url: "" # TODO: בדוק ידנית (deployed on Render)
  video_url: "" # TODO: בדוק ידנית

setup:
  quickstart: |
    1. git clone <repo-url> && cd routine
    2. pnpm install
    3. # הגדר DATABASE_URL ב-.env
    4. pnpm db:push
    5. pnpm dev

your_role: "פיתוח מלא – ארכיטקטורה full-stack, React UI, tRPC API, סכמת DB, auth, deployment"

tradeoffs:
  - tRPC מספק type-safety מעולה אך מצמצם גמישות לעומת REST/GraphQL
  - MySQL במקום PostgreSQL – בחירה לפי תשתית קיימת
  - Drizzle ORM – קל ומהיר אך פחות בוגר מ-Prisma

metrics: "" # TODO: בדוק ידנית

faq:
  - q: "למי מיועד הכלי?"
    a: "להורים ומחנכים שרוצים לבנות שגרה יומית לילדים בתקופות של חוסר ודאות."
  - q: "צריך MySQL?"
    a: "כן – המערכת משתמשת ב-Drizzle ORM עם MySQL. צריך להגדיר DATABASE_URL."
---
