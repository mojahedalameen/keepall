# Workspace

## Overview

pnpm workspace monorepo using TypeScript. **keepall** — a production-ready academic materials platform for students.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: Clerk (`@clerk/express` backend, `@clerk/react` frontend)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + wouter routing
- **Build**: esbuild (server), Vite (client)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture

### Artifacts
- `artifacts/api-server` — Express API server (port 8080, path `/api`)
- `artifacts/keepall` — React+Vite frontend (path `/`)

### Libraries
- `lib/db` — Drizzle ORM database client + all schemas
- `lib/api-spec` — OpenAPI spec + Orval codegen config
- `lib/api-zod` — Generated Zod schemas from OpenAPI spec
- `lib/api-client-react` — Generated React Query hooks from OpenAPI spec

## Database Schema (lib/db/src/schema/)
- `users` — Clerk-synced user profiles (clerkId PK)
- `semesters` — Academic semesters per user
- `subjects` — Subjects with color, icon, instructor, semesterId
- `lectures` — Lectures per subject with date and summary
- `notes` — Notes with tags (array), pinned flag, soft delete
- `files` — File records with storageKey, soft delete
- `audio_records` — Audio recordings with transcript, storageKey
- `exams` — Past exams with year/term/type/difficulty, soft delete
- `tasks` — Tasks with priority/status, soft delete
- `reminders` — Reminders with remindAt timestamp
- `tags` — User-defined tags with color
- `activity_logs` — Admin audit log

## API Routes (artifacts/api-server/src/routes/)
- `/api/healthz` — health check
- `/api/dashboard/*` — stats, upcoming, recent-files, recent-notes
- `/api/semesters/*` — CRUD + activate
- `/api/subjects/*` — CRUD + stats
- `/api/lectures/*` — CRUD (subjectId required)
- `/api/notes/*` — CRUD + pin toggle, soft delete
- `/api/files/*` — CRUD + upload-url endpoint, soft delete
- `/api/audio/*` — CRUD
- `/api/exams/*` — CRUD, soft delete
- `/api/tasks/*` — CRUD + status update, soft delete
- `/api/reminders/*` — CRUD
- `/api/tags/*` — CRUD
- `/api/search` — global search across all entities
- `/api/trash` — list trash, restore, purge
- `/api/profile` — user profile get/update
- `/api/admin/*` — admin stats, users list/detail, activity log

## Frontend Pages (artifacts/keepall/src/pages/)
- `home.tsx` — landing page (marketing for signed-out, redirect for signed-in)
- `dashboard.tsx` — stats cards, upcoming tasks/reminders, recent files/notes
- `semesters.tsx` — full semester CRUD with activate toggle
- `subjects.tsx` — subject grid with color chips, semester filter, CRUD
- `subject-detail.tsx` — tabbed subject workspace (Lectures, Notes, Files, Audio, Exams, Tasks, Reminders)
- `notes.tsx` — all notes, pin/unpin, filter by subject, CRUD
- `tasks.tsx` — Kanban-style tasks view, filter by priority/subject, CRUD
- `search.tsx` — global search with debounce, type filter tabs
- `trash.tsx` — restore/purge soft-deleted items
- `settings.tsx` — user profile, display name edit, sign out
- `admin/dashboard.tsx` — admin overview stats + activity log
- `admin/users.tsx` — paginated user table, toggle active/inactive
- `admin/user-detail.tsx` — user profile with content stats

## Auth
- Clerk whitelabel auth configured
- `requireAuth` middleware upserts user on first login
- `requireAdmin` checks `sessionClaims.metadata.role === 'admin'`
- Frontend admin guard: `useUser().user?.publicMetadata?.role === 'admin'`
- Clerk proxy middleware configured for production domain proxying

## Important Notes
- `lib/api-zod/src/index.ts` must only contain `export * from "./generated/api"` — Orval overwrites on codegen
- Orval zod config: `mode: "single"`, `target: "generated/api.ts"`
- All API routes use Zod schemas from `@workspace/api-zod` for validation
- Frontend hooks import from `@workspace/api-client-react` only
- Object storage integration not yet implemented — file upload uses placeholder storageKey
