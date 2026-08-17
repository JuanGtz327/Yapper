# Feature: Vercel deployment readiness

**From build-plan:** feature 20
**Status:** completed
**Provider:** Vercel
**Branch:** `feature/vercel-deployment-readiness`

## Goal

Dejar Yapper listo para desplegar como SPA estática en Vercel, con fallback de
rutas, contrato de variables de entorno y evidencia reproducible del artefacto
de producción.

## Delivered

- `vercel.json` con `npm run build`, output `dist`, preset Vite y rewrite SPA.
- Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` documentadas en
  `.env.example` y `README.md`, sin credenciales reales.
- Documentación de configuración local, Vercel y Supabase Auth redirects.
- Smoke check del artefacto de producción para catálogo público, login, ajustes
  y estadísticas.
- Corrección de una discrepancia encontrada durante la validación: la ruta real
  del catálogo es `/tienda/[slug]`, no `/catalogo/[slug]`.

## Verification evidence

| Check | Result |
| --- | --- |
| `npm run build` | passed |
| `npm run test:run` | 497 passed in 34 files |
| `npm run lint` | passed |
| `npm run test:e2e` | 25 passed with 4 workers |
| Preview smoke via Playwright | public catalog, login, settings and stats passed |
| `npx prettier --check README.md vercel.json blueprint/context/current-feature.md` | passed |
| `git diff --check` | passed |

The repository-wide `npm run format:check` still reports the pre-existing
warning in `src/lib/repository.test.ts`; modified files were checked separately.

## Deployment contract

- Build command: `npm run build`.
- Output directory: `dist`.
- Required build-time variables:
  - `VITE_SUPABASE_URL`, without `/rest/v1`.
  - `VITE_SUPABASE_ANON_KEY`, the public anonymous key only.
- Service-role keys and private secrets must never use the `VITE_` prefix.
- Configure Vercel variables for Production, Preview and Development.
- Configure Supabase Auth `Site URL` and `Redirect URLs` for the canonical
  deployment URL and local development.
- Direct requests to client routes must resolve through `/index.html`.

## What to verify before a real deploy

- Do not treat a successful build as proof that Supabase or Auth is configured.
- Open `/tienda/mi-negocio` without authentication and confirm catalog data.
- Log in at `/`, then refresh `/ajustes` and `/estadisticas` directly.
- Inspect browser console and network errors, not only visible page text.
- Keep `.env.local` and remote environment values out of git.
- A local `vite preview` proves the built artifact and route behavior, not that a
  remote Vercel project exists.

## Out of scope

- Creating or configuring a remote Vercel project.
- Supabase migrations, RLS, data, domains, billing or CI/CD.
