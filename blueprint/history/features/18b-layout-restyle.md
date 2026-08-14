# Feature: Layout restyle (18b)

**From build-plan:** feature 18b
**Status:** not started

## Goal

Migrate the app shell, sidebar, topbar, and mobile nav drawer from legacy CSS classes in `App.css` to Tailwind utility classes. This is the structural backbone of the restyle effort - once the layout is Tailwind-native, page-level restyles (18c-18e) can build against it.

## In scope

- Convert `.app-shell` flex layout to Tailwind utilities in `App.tsx`
- Convert `AppSidebar.tsx` from `.sidebar`, `.brand`, `.nav-item`, `.sidebar-bottom`, `.profile`, `.avatar` classes to Tailwind
- Convert `Topbar.tsx` from `.topbar`, `.topbar-heading`, `.mobile-menu-button`, `.eyebrow` classes to Tailwind
- Convert `MobileNavDrawer.tsx` from `.mobile-drawer`, `.mobile-drawer-overlay`, `.mobile-drawer-heading` classes to Tailwind (keep focus trap logic untouched)
- Remove the layout-related CSS from `App.css` after migration (only the classes listed above - not page-specific styles)
- Preserve the 850px responsive breakpoint behavior (sidebar hidden on mobile, hamburger visible)

## Out of scope

- Page content restyle (dashboard, products, orders, clients, settings, stats, catalog) - that is 18c-18e
- Auth screen restyle - part of 18e
- Public catalog page restyle - part of 18e
- Adding dark mode toggle - not planned yet
- Changing the shadcn theme tokens or color palette
- Changing navigation behavior, routing, or component logic

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Port layout tokens to index.css** - add custom Tailwind theme variables for the layout-specific values not yet in the theme (sidebar width 252px, topbar padding, nav-item colors like `--plum` hover/active backgrounds, drawer overlay color, drawer width). Map these into `@theme inline` so components can reference them as `bg-sidebar`, `text-nav-*`, etc. *Done when:* new `@theme inline` entries exist, the app still builds, and no visual change is visible.

- [x] **Step 2 - Convert App.tsx shell** - replace `.app-shell` class with Tailwind flex utilities (`flex min-h-screen bg-background`). Replace `.main-content` class with Tailwind (`w-full max-w-[1200px] mx-auto` + responsive padding). Replace `.data-notice` with Tailwind. Replace `.auth-loading` with Tailwind (`grid place-content-center justify-items-center min-h-screen gap-3 text-muted-foreground`). *Done when:* the app shell renders identically, the `app-shell`, `main-content`, `data-notice`, and `auth-loading` CSS rules in App.css are unused.

- [x] **Step 3 - Convert AppSidebar.tsx** - replace all legacy classes (`.sidebar`, `.brand`, `.brand-mark`, `.nav-label`, `.nav-item`, `.sidebar-bottom`, `.profile`, `.avatar`) with Tailwind utilities. Use `cn()` for conditional active state (`page === label`). Preserve the `w-[252px]` fixed width, flex column layout, and bottom-pinned settings/profile section. *Done when:* sidebar renders identically, sidebar CSS rules in App.css are unused.

- [x] **Step 4 - Convert Topbar.tsx** - replace `.topbar`, `.topbar-heading`, `.mobile-menu-button`, `.eyebrow` classes with Tailwind. The hamburger button gets `hidden max-md:grid` (show below 850px). Date text gets `text-[10px] font-bold tracking-[1.25px] uppercase text-muted-foreground`. *Done when:* topbar renders identically, topbar CSS rules in App.css are unused.

- [x] **Step 5 - Convert MobileNavDrawer.tsx** - replace `.mobile-drawer-overlay` and `.mobile-drawer` classes with Tailwind. Overlay: `fixed inset-0 z-[19] bg-black/40 border-0`. Drawer: `fixed inset-y-0 left-0 z-[20] flex flex-col w-[min(320px,86vw)] bg-sidebar border-r border-border`. Drawer heading: `flex items-start justify-between mb-9`. Add a `<style>` tag or use Tailwind `@keyframes` for the `drawer-in` animation. Keep the focus trap and body scroll lock logic completely untouched. *Done when:* mobile drawer renders identically, mobile-drawer CSS rules in App.css are unused, focus trap and Escape key still work.

- [x] **Step 6 - Remove migrated CSS from App.css** - delete the layout-related rules that are now unused: `.app-shell`, `.sidebar`, `.brand`, `.brand-mark`, `.nav-label`, `.main-nav`, `.nav-item`, `.sidebar-bottom`, `.profile`, `.avatar`, `.main-content`, `.topbar`, `.topbar-heading`, `.mobile-menu-button`, `.eyebrow`, `.mobile-drawer-overlay`, `.mobile-drawer`, `.mobile-drawer-heading`, `.mobile-drawer .brand`, `.mobile-drawer .main-nav`, `.mobile-drawer .nav-label`, `.mobile-drawer .nav-item`, `@keyframes drawer-in`, and the `@media (max-width: 850px)` rules for `.sidebar`, `.main-content`, `.mobile-menu-button`. Also remove the layout-related `:root` CSS variables (`--ink`, `--muted`, `--line`, `--cream`, `--plum`, `--plum-dark`, `.sidebar`). *Done when:* `npm run build` passes, `npm run lint` passes, and no layout class references remain in the codebase. Keep the header comment in App.css updated to reflect what remains active.

## Files / areas

- `src/index.css` - add layout tokens to `@theme inline`
- `src/App.tsx` - convert shell classes (lines 117-189)
- `src/components/layout/AppSidebar.tsx` - full Tailwind conversion
- `src/components/layout/Topbar.tsx` - full Tailwind conversion
- `src/components/layout/MobileNavDrawer.tsx` - full Tailwind conversion (keep logic)
- `src/App.css` - remove migrated layout rules, keep page-specific styles

## Data / contracts

- No schema or API changes. This is purely a styling migration.
- The `cn()` utility at `src/lib/utils.ts` is already available for conditional class merging.

## Testing

- Verify with build: `npm run build` must pass after each step
- Verify with lint: `npm run lint` must pass after each step
- Visual verification: app shell, sidebar, topbar, and mobile drawer should render identically before and after
- Responsive check: sidebar hides below 850px, hamburger shows, mobile drawer opens/closes with focus trap
- No unit tests needed - this is a styling-only change with no logic modifications

## Notes for the AI

- Use `cn()` from `@/lib/utils` for conditional classes (e.g., active nav state)
- The sidebar uses `var(--sidebar)` background which maps to `oklch(0.9967 0.0054 95.1)` - use `bg-sidebar` after adding it to the theme
- The nav-item active/hover colors use plum tints (`#f8f2f8` hover, `#f3eaf4` active) - these need theme tokens or inline values
- Keep the focus trap in MobileNavDrawer completely untouched - it is logic, not styling
- The 850px breakpoint is the only responsive breakpoint relevant to layout. Tailwind's default `md` is 768px, so use arbitrary values like `max-[850px]:hidden` for sidebar hide and `min-[851px]:hidden` for mobile drawer hide. This preserves the exact current behavior without needing a custom breakpoint config.
- Do NOT remove page-specific CSS from App.css (dashboard, products, orders, etc.) - that is 18c-18e
- Run `npm run build` and `npm run lint` after each step to verify
