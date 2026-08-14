# Feature: Dashboard restyle (18c)

**From build-plan:** feature 18c
**Status:** not started

## Goal

Migrate the dashboard page from legacy CSS classes in `App.css` to Tailwind utility classes. The sub-components (Stat, PanelHeading, QuickAction, Empty) are already Tailwind - this converts the layout containers, welcome card, stats grid, content grid, and the hand-rolled bar chart.

## In scope

- Convert `.welcome-card` hero banner to Tailwind (purple gradient, `::after` decorative circle via a sibling div)
- Convert `.stats-grid` 3-column grid to Tailwind
- Convert `.content-grid` 2-column layout to Tailwind
- Convert `.panel` card styling to Tailwind
- Convert the chart layout (`.chart-placeholder`, `.chart-y-axis`, `.chart-area`, `.chart-lines`, `.bar-chart`, `.chart-days`) to Tailwind
- Convert `.quick-actions` container to Tailwind
- Preserve responsive behavior at 650px (grids collapse to 1 column, welcome decoration hides)
- Remove migrated dashboard CSS from `App.css`

## Out of scope

- Restyling the page content (colors, spacing, visual design) - this is a faithful migration, not a redesign
- Sub-component internals (Stat, PanelHeading, QuickAction, Empty) - already Tailwind
- Stats page chart styles (`.big-chart`, `.chart-days` in stats context) - separate feature
- Other page-specific CSS (auth, products, orders, clients, settings, catalog)

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Convert welcome card + stats grid** - replace `.welcome-card` with Tailwind: `relative overflow-hidden flex items-center justify-between min-h-[145px] p-[30px_35px] mb-[22px] rounded-[14px] text-white bg-[#744b78]`. Replace the `::after` pseudo-element with a sibling `<div>` using `absolute w-[270px] h-[270px] right-[65px] top-[-108px] border border-white/10 rounded-full shadow-[0_0_0_30px_rgba(255,255,255,0.06),0_0_0_60px_rgba(255,255,255,0.03)]`. Convert `.welcome-tag` and `.welcome-decoration` to Tailwind. Replace `.stats-grid` with `grid grid-cols-3 gap-4 mb-[22px] max-[650px]:grid-cols-1`. Convert the responsive welcome card padding (25px on mobile) and decoration hide. *Done when:* welcome card and stats grid render identically, build passes.

- [x] **Step 2 - Convert content grid + panel styling** - replace `.content-grid` with `grid grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)] gap-4 max-[650px]:grid-cols-1`. Replace `.panel` with `border border-border rounded-[13px] bg-sidebar p-[23px_24px]`. Add `max-[650px]:min-w-0` to `.sales-panel` and `.quick-panel` equivalents. *Done when:* content grid and panels render identically, build passes.

- [x] **Step 3 - Convert chart layout** - replace `.chart-placeholder` with `flex h-[220px] pt-[28px]`. Replace `.chart-y-axis` with `flex flex-col justify-between pb-[23px] text-muted-foreground text-[10px]`. Replace `.chart-area` with `relative flex-1 ml-[14px]`. Replace `.chart-lines` with `absolute inset-x-0 top-0 bottom-[23px] flex flex-col justify-between` and each `<i>` with `block border-t border-dashed border-[#ece8e6]`. Replace `.bar-chart` with `absolute inset-x-0 top-0 bottom-[23px] flex items-end gap-2 pt-2 px-[2px]` and each bar `<span>` with `flex-1 min-w-[4px] rounded-t-[5px] bg-[#c99fca] transition-[height] duration-300`. Replace `.chart-days` with `absolute inset-x-0 bottom-0 flex justify-between text-muted-foreground text-[10px]`. Update `DashboardPage.test.tsx` line 170 to query by `aria-label="Ventas por día"` instead of `.bar-chart` class. *Done when:* chart renders identically, test passes, build passes.

- [x] **Step 4 - Convert quick actions + cleanup** - replace `.quick-actions` with `mt-[17px]`. Remove all migrated dashboard CSS from App.css: `.welcome-card` (and `::after`, h2, p), `.welcome-tag`, `.welcome-decoration`, `.stats-grid`, `.content-grid`, `.panel` (shared), `.chart-placeholder`, `.chart-y-axis`, `.chart-area`, `.chart-lines`, `.bar-chart`, `.chart-days`, `.quick-actions`. Update the App.css header comment. *Done when:* `npm run build` passes, `npm run lint` passes, no dashboard class references remain in App.css. Also remove dead `.stat-card`, `.stat-heading`, `.panel-heading`, `.text-button`, `.action-icon`, `.peach`, `.mint`, `.lavender` rules (confirmed dead in 18b audit).

## Files / areas

- `src/features/dashboard/DashboardPage.tsx` - convert all className attributes to Tailwind
- `src/App.css` - remove migrated dashboard rules + dead CSS

## Data / contracts

- No schema or API changes. This is a styling-only migration.
- `DashboardPage` props remain unchanged.

## Testing

- Verify with build: `npm run build` must pass after each step
- Verify with lint: `npm run lint` must pass after each step
- Visual verification: dashboard should render identically before and after
- Responsive check: grids collapse at 650px, welcome decoration hides, chart remains functional
- The dashboard test (`DashboardPage.test.tsx`) queries `.bar-chart` - this class will be replaced by Tailwind inline styles. The test may need updating if it depends on the CSS class name.

## Notes for the AI

- The `::after` pseudo-element on `.welcome-card` creates a decorative circle. Replace with a sibling `<div>` since Tailwind doesn't support `::after` via utility classes. Use `aria-hidden="true"`.
- The chart uses `<i>` elements for gridlines. Convert these to Tailwind-styled `<i>` elements (keep the semantic element, just change the class).
- The chart bar `<span>` elements use inline `style={{ height }}` for dynamic heights - this stays as-is.
- The `h2` and `p` global resets (`margin: 0`) in App.css are shared with other pages - do NOT remove them.
- `.quick-actions strong` and `.quick-actions small` styles are handled by the QuickAction component (already Tailwind) - the App.css rules for these are now dead.
- The `@media (max-width: 650px)` block in App.css has mixed dashboard and non-dashboard rules. Only remove the dashboard-specific ones (`.stats-grid`, `.content-grid`, `.welcome-card`, `.welcome-decoration`, `.sales-panel`, `.quick-panel`).
