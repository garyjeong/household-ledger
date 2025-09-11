# Repository Guidelines

## Project Structure & Module Organization

- App code lives in `src/`:
  - `src/app` (Next.js App Router routes, layouts, pages)
  - `src/components`, `src/lib`, `src/hooks`, `src/contexts`, `src/types`
- Database schema in `prisma/schema.prisma`; assets in `public/`.
- Tests in `tests/` (API, components, lib, e2e, helpers).

## Build, Test, and Development Commands

- Dev: `pnpm dev` (Next.js on `http://localhost:3001`, Playwright uses this).
- Build: `pnpm build` (generates Prisma client, Next build).
- Start: `pnpm start` (serve production build).
- Lint/Format: `pnpm lint`, `pnpm lint:fix`, `pnpm format`.
- Types: `pnpm type-check`.
- Unit/Integration: `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`.
- E2E: `pnpm test:e2e`, UI mode `pnpm test:e2e:ui`.
- DB: `pnpm db:migrate`, `pnpm db:push`, `pnpm db:seed`, `pnpm db:studio`.
- Security: `pnpm security:check`, `pnpm security:audit`.

## Coding Style & Naming Conventions

- Language: TypeScript + React. Use functional components.
- Formatting: Prettier (no semicolons, single quotes, width 100). Run `pnpm format`.
- Linting: ESLint (Next + TS). Fix warnings before merging.
- Naming: PascalCase for components/types, camelCase for functions/vars, kebab-case for file and directory names (e.g., `transaction-form.tsx`).
- Imports: follow eslint import order; avoid console except `warn`/`error`.

## Testing Guidelines

- Frameworks: Jest (+ RTL) for unit/integration; Playwright for e2e.
- Locations: `tests/**/*.(test|spec).(ts|tsx)` and `src/**/*.(test|spec).(ts|tsx)`.
- Coverage: global ≥70%; `src/lib` ≥80%; `src/app/api` ≥75% (see `jest.config.js`).
- Run before PR: `pnpm test:coverage` and, if applicable, `pnpm test:e2e`.

## Commit & Pull Request Guidelines

- Commits: use Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`). Keep messages focused (e.g., `fix: handle empty merchant in transaction form`).
- PRs must include: clear description, linked issue (e.g., `Closes #123`), screenshots for UI changes, migration notes if Prisma schema changes, and checklist that lint, types, tests pass.

## Security & Configuration

- Environment: set in `.env.local`. Common keys: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- Do not commit secrets or local DB files. Use `pnpm db:migrate` to evolve schema and include migration rationale in PRs.
- Cookies and JWTs are production-secured; verify auth flows when changing middleware or `src/lib/auth.ts`.
