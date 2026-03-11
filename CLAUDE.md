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

## Changelog Requirement (IMPORTANT)

After completing **every task** that modifies code, you **MUST** update `CHANGELOG.md` at the root of the repo.

### What to log:
- Feature additions, UI changes, bug fixes, schema changes, new pages/components, logic changes
- Anything that Manus would need to replicate on its original codebase

### What NOT to log:
- Infrastructure changes specific to the Render migration (render.yaml, auth system swap, Manus plugin removal)
- Changes to CLAUDE.md, CHANGELOG.md itself, test fixtures, or dev tooling

### Rules:
1. Add a new entry at the **top** of the changelog (newest first), under the current date heading
2. Each entry must include:
   - **What changed** — short Hebrew description of the change
   - **Files** — list of every file that was added, modified, or deleted
   - **Details** — concise technical summary in Hebrew of what was done and why
3. If the date heading already exists, add the entry under it. Otherwise create a new date heading
4. Never delete or modify existing entries
5. Write the changelog in **Hebrew** — this file will be handed to another AI (Manus) for re-implementation on the original codebase

### Format:
```markdown
## [YYYY-MM-DD]

### <short title in Hebrew>
**קבצים:** `file1.ts`, `file2.tsx`, ...
**פירוט:** <technical description in Hebrew of what changed, why, and any important implementation details>
```

## Language
- **Code comments**: Write in Hebrew
- **PR summaries**: Write in Hebrew
- **Commit messages**: English is fine
