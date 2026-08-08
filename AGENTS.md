# Agent Guide

## Commands

- Install with `npm install`; use the committed `package-lock.json`.
- Run the dev server with `npm run dev`.
- Run lint with `npm run lint` (Oxlint, configured in `.oxlintrc.json`).
- Format the codebase with `npm run format` (Prettier, configured in `.prettierrc.json`); verify formatting without writing with `npm run format:check`.
- Run the production check with `npm run build`; this runs `tsc -b` before `vite build`.
- Preview a completed production build with `npm run preview`.
- Run tests with `npm run test:run`; run in watch mode with `npm run test`; check coverage with `npm run test:coverage`.

## Structure

- `src/main.tsx` is the browser entrypoint and mounts `src/App.tsx`.
- `src/App.tsx` contains the current dashboard UI; `src/App.css` and `src/index.css` provide its styling.
- `src/lib/supabase.ts` is the Supabase client boundary. It reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Vite environment files and uses placeholders when unset.
- `vite.config.ts` enables React, Tailwind CSS, and `vite-plugin-pwa`; production builds generate the service worker and manifest in `dist/`.

## Agents

- `testing-expert`: Ejecuta todas las pruebas (`npm run test:run`), verifica cobertura de tests por cada funcionalidad nueva, y corre lint + typecheck. Usa el subagente `testing-expert` para validar que todo funcione.
- `code-reviewer`: Revisión exhaustiva de código (correctitud, seguridad, tipado, convenciones, rendimiento). **Siempre** delega la validación de tests al `testing-expert` antes de emitir veredicto. No aprueba cambios con tests fallidos o tests faltantes.

## Conventions

- TypeScript is checked through the root project references; source is under `src`, and unused locals/parameters are errors.
- Follow the existing explicit `.tsx` import style (for example, `./App.tsx`).
- For Supabase-backed work, put local credentials in `.env.local` using the names in `.env.example`; do not commit local env files.

## Database Migrations

- The Supabase project ref is `ylbcjnyovrtxkohyrtvf`; the CLI config is in `supabase/config.toml`.
- `supabase/migrations/20260805000000_initial_schema.sql` is the canonical v1 baseline. It was already applied manually to the remote development database; do not run it against that database again.
- Before the first remote push, authenticate with `supabase login`, link with `supabase link --project-ref ylbcjnyovrtxkohyrtvf`, then mark the baseline applied with `supabase migration repair 20260805000000 --status applied`.
- Create every later schema, function, policy, index, permission, or RPC change with `npm run db:migration -- <description>` and commit the generated file under `supabase/migrations/`.
- Apply reviewed migrations with `npm run db:push`; do not make persistent schema changes by pasting SQL into the Supabase dashboard.
- Regenerate database types after schema changes with `npm run db:types`; the generated output belongs in `src/types/supabase.ts`.
- The initial baseline contains a development reset (`drop ... cascade`) because the remote database was intentionally cleaned. New migrations must be incremental and must not reset existing data.
