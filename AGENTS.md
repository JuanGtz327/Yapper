# AGENTS.md

Instructions for AI coding agents working in this project.

## What this is

**Yapper** - un gestor de ventas para pequeños negocios. Crea productos, gestiona
clientes y registra pedidos. El catálogo público ayuda a mostrar productos y
mejorar ventas por WhatsApp. No es un sistema de venta online; la transacción
ocurre fuera de la app.

Stack: Vite 8 + React 19 + TypeScript 6 + Tailwind CSS v4 + Supabase + TanStack
React Query v5. PWA con vite-plugin-pwa.

## Conventions

Follow the coding standards in `blueprint/context/coding-standards.md`.

## Commands

- Dev server: `npm run dev` (http://localhost:5173)
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint`
- Format: `npm run format`
- Format check: `npm run format:check`
- Test (watch): `npm test`
- Test (single): `npm run test:run`
- Test coverage: `npm run test:coverage`
- DB migration: `npm run db:migration`
- DB push: `npm run db:push`
- DB types: `npm run db:types`

Testing is configured (Vitest + Testing Library) and is a gate for logic-bearing steps.
