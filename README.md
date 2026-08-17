# Yapper

Gestor de ventas para pequenos negocios. Yapper organiza productos, inventario,
clientes y pedidos; el catalogo publico ayuda a compartir productos por
WhatsApp, pero el cobro ocurre fuera de la app.

## Local development

Requirements: Node.js and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Replace the placeholders in `.env.local` with the Supabase project values.
`.env.local` is ignored by git and must never be committed.

## Production build

The Vercel project uses the settings already declared in `vercel.json`:

| Setting          | Value                                           |
| ---------------- | ----------------------------------------------- |
| Framework preset | Vite                                            |
| Build command    | `npm run build`                                 |
| Output directory | `dist`                                          |
| SPA fallback     | All client-side routes rewrite to `/index.html` |

Required environment variables must be configured in Vercel for every
environment that builds the app (`Production`, `Preview`, and `Development`):

| Variable                 | Value                                    |
| ------------------------ | ---------------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL, without `/rest/v1` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anonymous key            |

Vite embeds `VITE_*` values in the browser bundle. The anonymous key is intended
for the client and is protected by Supabase RLS, but service-role keys and other
private secrets must never use the `VITE_` prefix.

## Supabase Auth setup

After the Vercel project has a deployment URL, configure Supabase Dashboard
under `Authentication > URL Configuration`:

- Set `Site URL` to the canonical production URL.
- Add the production URL to `Redirect URLs`.
- Add the Vercel preview URL pattern only if preview deployments need Auth.
- Keep `http://localhost:5173` in `Redirect URLs` for local development.

The public catalog does not require authentication. Authenticated routes such as
`/ajustes` and `/estadisticas` require the Supabase environment variables and a
valid session.

## Checks

```bash
npm run build
npm run test:run
npm run lint
npm run test:e2e
npm run preview -- --host 127.0.0.1
```

Before accepting a deployment, open the deployment URL and directly refresh `/`,
`/tienda/mi-negocio`, `/ajustes`, and `/estadisticas`. Confirm that the
browser console and network tab contain no deployment or Supabase errors.
