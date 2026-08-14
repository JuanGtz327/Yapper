# Feature: Orders pages restyle (18d2)

**From build-plan:** feature 18d2 (sub-feature 2 of 4)
**Status:** not started

## Goal

Migrate the orders pages and modals from legacy CSS classes in `App.css` to Tailwind utility classes. This covers OrdersPage (list), OrderCreatePage (form), OrderDetailPage (detail), OrderModal, and OrderTicketModal.

Shared classes (`.page-section`, `.section-intro`, `.form-grid`, `.modal-actions`, `.table-card`, `.table-filters`, etc.) are migrated separately in 18d4 and are left as-is in this spec. Payment components (PaymentForm, PaymentModal, PaymentProgress, PaymentHistory) are migrated in 18d3.

## In scope

- OrdersPage: order summary grid, order cards, order table, order row styling, responsive card/table toggle
- OrderCreatePage: order editor layout, line items grid, add-line button, order total
- OrderDetailPage: detail layout (main + sidebar), status controls, detail grid, product list
- OrderModal: order form in modal context
- OrderTicketModal: ticket display, detail grid, status controls, actions footer

## Out of scope

- Shared classes (`.page-section`, `.section-intro`, `.form-grid`, `.modal-actions`, `.table-card`, `.table-filters`, `.eyebrow`) - migrated in 18d4
- Payment components (PaymentForm, PaymentModal, PaymentProgress, PaymentHistory) - migrated in 18d3
- `.badge` and `.segmented-control` - shared, migrated in 18d4
- Product pages - already migrated in 18d
- Auth, Settings, Stats, Catalog, Clients pages - migrated in 18e

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - OrdersPage list** - convert order-specific classes in OrdersPage.tsx: `.order-summary` grid (with child div/span/strong styling) to Tailwind, `.order-row` cursor/hover/focus, `.orders-table` responsive hide, `.orders-cards` responsive show, `.order-card` + heading/client/meta/actions sub-classes to Tailwind. Keep shared classes for 18d4. *Done when:* OrdersPage renders identically, build passes.

- [x] **Step 2 - OrderCreatePage form** - convert order-specific classes: `.order-editor-page` width + section-intro override, `.order-editor-card` card styling + responsive padding, `.order-form` gap, `.order-lines` grid, `.line-heading` flex + font, `.order-line` grid layout (with editor-card override), `.order-line-stock` grid-column + font, `.order-line-remove` justify, `.line-total` font/alignment, `.add-line` dashed border button, `.order-total` flex + border + strong. Keep shared classes for 18d4. *Done when:* OrderCreatePage renders identically, build passes.

- [x] **Step 3 - OrderDetailPage** - convert order-specific classes: `.order-detail-page` max-width, `.order-detail-layout` grid (with 860px breakpoint), `.order-detail-main` / `.order-detail-sidebar` grid + sticky, `.order-detail-card` padding/border/bg, `.order-detail-grid-full` grid + children, `.order-detail-id` monospace, `.order-detail-total` plum color, `.order-detail-products` product list grid + children, `.detail-muted` font, `.order-status-controls` grid + fieldset/legend, `.status-card-rows/row/cancelled/readonly` to Tailwind. Keep `.segmented-control` for 18d4. *Done when:* OrderDetailPage renders identically, build passes.

- [x] **Step 4 - Order modals** - convert order-specific classes in OrderModal.tsx (`.order-form`, `.order-lines`, `.line-heading`, `.order-line`, `.line-total`, `.add-line`, `.order-total`) and OrderTicketModal.tsx (`.order-detail-grid` + children, `.detail-muted`, `.order-detail-actions`, `.order-actions-footer` + responsive, `.ticket-lines/heading/columns/product/quantity/total` + responsive overrides, `.modal:has(.order-ticket)` sizing). Keep `.modal-actions`, `.form-grid`, `.segmented-control`, `.badge` for 18d4. *Done when:* Both modals render identically, build passes.

- [x] **Step 5 - Order-specific CSS cleanup** - remove all order-only CSS rules from App.css: `.order-summary` + children, `.order-row` + hover/focus, `.orders-table` responsive, `.orders-cards` responsive, `.order-card` + all sub-classes, `.order-card-statuses`, `.order-form`, `.order-editor-page` + children, `.order-editor-card` + children, `.order-lines`, `.order-line` + children, `.line-heading`, `.line-total`, `.add-line`, `.order-total`, `.order-detail-page` + layout + children, `.detail-muted`, `.order-status-controls`, `.status-card-*`, `.order-detail-grid` + children, `.order-detail-actions`, `.order-actions-footer`, `.ticket-*` classes, `.modal:has(.order-ticket)`, `.modal:has(.order-details)`, and their responsive media query rules. Update App.css header comment. *Done when:* `npm run build` passes, `npm run lint` passes, no order-only class references remain in App.css.

## Files / areas

- `src/features/orders/OrdersPage.tsx` - convert order list classes
- `src/features/orders/OrderCreatePage.tsx` - convert order form classes
- `src/features/orders/OrderDetailPage.tsx` - convert order detail classes
- `src/features/orders/OrderModal.tsx` - convert order modal form classes
- `src/features/orders/OrderTicketModal.tsx` - convert ticket modal classes
- `src/App.css` - remove migrated order-only rules

## Data / contracts

- No schema or API changes. This is a styling-only migration.
- All page props and component interfaces remain unchanged.

## Testing

- Verify with build: `npm run build` must pass after each step
- Verify with lint: `npm run lint` must pass after each step
- Visual verification: order pages and modals should render identically before and after
- Existing order tests should continue to pass

## Notes for the AI

- Shared classes (`.page-section`, `.section-intro`, `.form-grid`, `.modal-actions`, `.table-card`, `.table-filters`, `.table-filter-count`, `.eyebrow`, `.section-actions`) are NOT migrated in this spec. Leave them as CSS class references.
- `.badge` and `.segmented-control` are shared - leave for 18d4.
- The order editor card has responsive grid overrides at 520px. Use `max-[520px]:` Tailwind variants.
- The order detail layout has an 860px breakpoint. Use `max-[860px]:` Tailwind variant.
- `.order-detail-total` has `!important` - use `!text-primary !text-lg` or similar Tailwind important syntax.
- `.order-card` uses `box-shadow: 0 5px 18px #30272e08` - use `shadow-[0_5px_18px_rgba(48,39,46,0.03)]`.
- The `.modal:has(.order-ticket)` and `.modal:has(.order-details)` rules size modals. These need to stay in CSS or be converted to Tailwind with `has-[]` variant.
- Run `npm run build` and `npm run lint` after each step to verify.
