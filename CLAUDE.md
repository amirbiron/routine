# Routine Anchors (שגרה בחוסר שגרה)

Interactive tool for building daily routine anchors for children during uncertain times.

## Architecture
- **Runtime**: Node.js + TypeScript
- **Server**: Express + tRPC
- **Client**: React 19 + Vite + Tailwind CSS + wouter
- **Database**: MySQL via Drizzle ORM
- **Auth**: Email + password with scrypt hashing, JWT sessions in HTTP-only cookies

## Commands
- `pnpm dev` — Start dev server with HMR
- `pnpm build` — Build client (Vite) + server (esbuild)
- `pnpm start` — Run production server
- `pnpm db:push` — Generate and run DB migrations
- `pnpm check` — TypeScript type check
- `pnpm test` — Run tests with Vitest
- `pnpm set-admin user@example.com` — Grant admin role to a user

## Key Directories
- `server/` — Express server, tRPC routers, DB queries
- `client/` — React SPA (pages, components, hooks)
- `shared/` — Constants and types shared between server/client
- `drizzle/` — DB schema and SQL migrations
