# Coding Standards

> Conventions for Yapper, derived from the real codebase. Updated from Blueprint
> defaults to match Vite + React + Supabase + Tailwind CSS v4.

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful
- Types live in `src/types.ts` (app types) and `src/types/supabase.ts` (generated DB types)

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks in `src/hooks/`

## Vite + React SPA

- Client-side rendering only (no SSR)
- Entry point: `src/main.tsx`
- PWA configured via vite-plugin-pwa with auto-update
- Environment variables prefixed with `VITE_` (e.g., `VITE_SUPABASE_URL`)

## File Organization

- Features: `src/features/[feature]/` (auth, catalog, clients, dashboard, orders, products, settings, stats)
- Shared components: `src/components/ui/` and `src/components/layout/`
- Custom hooks: `src/hooks/`
- React Query hooks: `src/hooks/queries/`
- Utilities: `src/lib/` (format, payment, routing, supabase, whatsapp)
- Types: `src/types.ts` and `src/types/supabase.ts`
- Tests: co-located with source (`feature.test.ts` or `__tests__/` in `src/lib/`)

## Naming

- Components: PascalCase (`ProductCard.tsx`)
- Files: match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS v4 (CSS-first config via `@import 'tailwindcss'` in `src/index.css`)
- Custom CSS variables in `src/App.css` (being migrated to Tailwind utilities)
- Dark mode: not implemented yet
- Target: migrate to shadcn/ui for reusable components during restyle phase

## Data Access

- Supabase client: `src/lib/supabase.ts`
- Data fetching via TanStack React Query v5
- Query keys: `src/lib/queryKeys.ts`
- Mutations: `src/hooks/queries/` directory
- Repository pattern: `src/lib/repository.ts` for Supabase CRUD operations

## Error Handling

- Try/catch in async operations
- Toast notifications for user feedback (react-toastify)
- `useToast` hook for consistent toast patterns

## Routing

- react-router-dom v7 is installed but not fully utilized
- Current: manual page switching via `useState<Page>` in App.tsx
- Target: migrate to proper `<BrowserRouter>` routes

## Testing

Test runner: Vitest + Testing Library + jsdom

### Vitest (unit + integration)

- **What to test:** pure logic in `src/lib/`, hook behavior, repository mocks, cache invalidation, validation rules, error propagation
- **What not to test:** UI component rendering, class names, text presence, visual layout
- **The gate:** a step that adds logic must ship a passing test in the same diff
- **Run:** `npm test` (watch) or `npm run test:run` (single)
- **Coverage:** `npm run test:coverage`

### E2E (Playwright)

- **What to test:** complete business flows (create order, add variant, register payment, edit settings, access public catalog)
- **What not to test:** pure logic, internal state, cache behavior
- **Run:** `npm run test:e2e`
- **Use isolated data:** seed a dedicated test user and stable records before the suite; make the seed idempotent and restore mutable values such as stock.
- **Prove outcomes:** after a mutation, assert the persisted result through the UI after reload, a follow-up query, or the next business flow. A toast, button state, or optimistic row alone is not proof.
- **Exercise failure paths:** submit invalid input or an impossible business operation and assert both the visible error and that the invalid state was not persisted.
- **Separate real failures from forced success:** prefer accessible controls and wait for the request or resulting state. Do not bypass disabled, hidden, or covered elements just to make a click pass; inspect the DOM and application behavior first.
- **Keep tests independent:** each test owns its setup and cleanup, and should still pass when workers run in parallel.

### Boundary

Vitest tests verify **rules and contracts** (validation, RPC payloads, cache, error states).
E2E tests verify **flows the seller sees** (create order end-to-end, variant with price update, payment registration).
UI rendering and text presence are verified by build + manual smoke test.

## Code Quality

- Linting: oxlint (`npm run lint`)
- Formatting: Prettier (`npm run format` / `npm run format:check`)
- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
