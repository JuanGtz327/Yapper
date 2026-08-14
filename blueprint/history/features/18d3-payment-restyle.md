# Feature: Payment components restyle (18d3)

**From build-plan:** feature 18d3 (sub-feature 3 of 4)
**Status:** not started

## Goal

Migrate the payment components from legacy CSS classes in `App.css` to Tailwind utility classes. This covers PaymentForm (payment form), PaymentModal (modal wrapper + summary), PaymentProgress (progress bar), and PaymentHistory (payment list).

All payment CSS classes are payment-ONLY (not used by other pages). The `.payment-action-section` class is also used in `OrderTicketModal.tsx` (line 196) - it will be converted there too.

## In scope

- PaymentForm: form grid, field labels, amount input, error state, quick amounts, method selector, submit button, spinner
- PaymentModal: summary grid, row layout, remaining amount, trigger button
- PaymentProgress: progress header, label, amounts, separator, bar, fill (with complete state), footer, remaining
- PaymentHistory: empty state, history list, header, item, icon, details, method, ref, notes, date
- OrderTicketModal: `.payment-action-section` class (line 196)

## Out of scope

- Shared classes (`.modal-actions`, `.form-grid`, `.badge`) - migrated in 18d4
- Order pages and modals - already migrated in 18d2
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

- [x] **Step 1 - PaymentProgress + PaymentHistory** - convert these two display-only components. PaymentProgress: `.payment-progress` → margin/padding/rounded/bg, `.payment-progress-header` → flex layout, `.payment-progress-label` → muted font, `.payment-progress-amounts` → flex + strong plum, `.payment-progress-separator` → muted font, `.payment-progress-bar` → height/rounded/bg, `.payment-progress-fill` → height/rounded/plum + `.is-complete` green, `.payment-progress-footer` → margin, `.payment-progress-remaining` → muted font. PaymentHistory: `.payment-history-empty` → flex center muted, `.payment-history` → margin, `.payment-history-header` → flex + h4 margin, `.payment-history ul` → list-none grid, `.payment-history-item` → flex rounded bg, `.payment-history-icon` → grid rounded plum bg, `.payment-history-details` → grid, `.payment-history-main` → flex + strong, `.payment-history-method/ref/notes/date` → muted fonts + truncation. *Done when:* both components render identically, build passes.

- [x] **Step 2 - PaymentForm** - convert the form component. `.payment-form` → grid gap, `.payment-form-field` → grid gap + label font, `.payment-form-amount-input` → (empty, migrated to shadcn), `.payment-form-error` → red font, `.payment-form-quick-amounts` → flex gap, `.payment-form-quick-btn` → flex-1 rounded border + hover plum, `.payment-form-method-group` → flex gap, `.payment-form-method` → flex-1 rounded border + hover plum + `.is-active` plum border/bg, `.payment-form-submit` → w-full justify-center mt, `.spin` → animate-spin. *Done when:* PaymentForm renders identically, build passes.

- [x] **Step 3 - PaymentModal + cleanup** - convert PaymentModal: `.payment-modal-summary` → grid rounded bg, `.payment-modal-row` → flex + span muted + strong, `.payment-modal-remaining` → border-top, `.payment-trigger-btn` → w-full justify-center. Also convert `.payment-action-section` in OrderTicketModal.tsx (line 196). Remove all payment-only CSS rules from App.css (lines 1442-1724, ~283 lines) and the `.spin` keyframes. Update App.css header comment. *Done when:* `npm run build` passes, `npm run lint` passes, no payment-only class references remain in App.css.

## Files / areas

- `src/features/orders/PaymentProgress.tsx` - convert progress display classes
- `src/features/orders/PaymentHistory.tsx` - convert history list classes
- `src/features/orders/PaymentForm.tsx` - convert form classes
- `src/features/orders/PaymentModal.tsx` - convert modal summary classes
- `src/features/orders/OrderTicketModal.tsx` - convert `.payment-action-section` (1 class)
- `src/App.css` - remove migrated payment-only rules

## Data / contracts

- No schema or API changes. This is a styling-only migration.
- All component props and interfaces remain unchanged.

## Testing

- Verify with build: `npm run build` must pass after each step
- Verify with lint: `npm run lint` must pass after each step
- Visual verification: payment components should render identically before and after
- Existing order tests should continue to pass

## Notes for the AI

- All payment CSS classes are payment-ONLY - safe to remove entirely from App.css.
- The `.spin` animation keyframes (lines 1667-1677) are only used by PaymentForm's Loader2 icon - convert to Tailwind `animate-spin` and remove the keyframes.
- `.payment-progress-fill.is-complete` changes the bar color to green (#579078) - use conditional `bg-[#579078]` or `bg-green-600`.
- `.payment-form-method.is-active` changes border and bg to plum - use conditional `border-primary bg-[#f3eaf4] text-primary`.
- The `.payment-action-section` class is used in OrderTicketModal.tsx line 196 - convert it there too.
- Run `npm run build` and `npm run lint` after each step to verify.
