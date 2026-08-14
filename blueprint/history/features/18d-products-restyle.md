# Feature: Products pages restyle (18d)

**From build-plan:** feature 18d (sub-feature 1 of 4)
**Status:** not started

## Goal

Migrate the product pages and modals from legacy CSS classes in `App.css` to Tailwind utility classes. This covers ProductsPage (list), ProductCreatePage (form), and all product-related modals (CategoryManager, OptionTypeManager, VariantManager, VariantModal, ProductModal).

Shared classes (`.page-section`, `.section-intro`, `.form-grid`, `.modal-actions`, `.panel`, table styles, etc.) are migrated separately in 18d4 and are left as-is in this spec.

## In scope

- ProductsPage: table layout, product dots, stock indicators, inventory summary, filters
- ProductCreatePage: form layout, variant list, product preview panel, category selector
- CategoryManagerModal: category list, add row
- OptionTypeManagerModal: option type list, value chips
- VariantManagerModal / VariantModal: variant form, option selection

## Out of scope

- Shared classes (`.page-section`, `.section-intro`, `.form-grid`, `.modal-actions`, `.panel`, table styles, `.badge`, `.segmented-control`) - migrated in 18d4
- Order pages and modals - migrated in 18d2
- Payment components - migrated in 18d3
- Auth screen, Settings, Stats, Catalog, Clients pages - migrated in 18e

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - ProductsPage list** - convert product-specific classes in ProductsPage.tsx: `.product-dot` (with color variants) to Tailwind (`inline-grid place-items-center w-[34px] h-[34px] mr-[10px] rounded-[9px]` + color classes), `.variant-label` to `block text-[11px] font-normal text-muted-foreground mt-[2px]`, `.stock` / `.stock.low` to `font-bold text-[#5f9e7c]` / `text-[#c5804a]`, `.inventory-summary` to Tailwind flex container. Keep shared classes (`.page-section`, `.section-intro`, `.table-card`, `.table-filters`, `.zebra-stripe`, `.row-hover`, `.col-left`, `.col-right`, `.table-emphasis`, `.table-filter-count`, `.eyebrow`) for 18d4. *Done when:* ProductsPage renders identically, build passes.

- [x] **Step 2 - ProductCreatePage form** - convert product-specific classes: `.product-section` (fieldset styling) to Tailwind border/rounded/padding, `.product-section legend` to font styling, `.field-error` to `block text-[#aa6259] text-[11px] mt-[2px]`, `.variant-list` / `.variant-list-item` / `.variant-info` / `.variant-meta` / `.variant-options-badge` / `.variant-actions` / `.variant-empty-hint` / `.variant-add-btn` to Tailwind, `.product-preview-*` classes (panel, card, image, placeholder, body, category, name, price, desc, summary) to Tailwind, `.category-row` / `.category-selector` to Tailwind flex layout, `.public-description-gap` to `mt-[8px]`, `.form-two` to `grid grid-cols-2 gap-3`. Keep `.form-grid`, `.modal-actions`, `.panel`, `.settings-layout`, `.field-help`, `.checkbox-label`, `.settings-section-divider` for 18d4. *Done when:* ProductCreatePage renders identically, build passes.

- [x] **Step 3 - Product modals** - convert product-specific classes in CategoryManagerModal.tsx (`.category-add-row`, `.category-list`, `.category-list-empty`, `.category-list-item`, `.category-list-select`), OptionTypeManagerModal.tsx (`.option-type-list`, `.option-type-item`, `.option-type-header`, `.option-type-toggle`, `.option-type-name`, `.option-type-count`, `.option-type-values`, `.option-value-list`, `.option-value-item`, `.option-value-empty`, `.option-value-add-row`), VariantManagerModal.tsx and VariantModal.tsx (`.variant-options`, `.option-selection-row`, `.option-add-btn`), and ProductModal.tsx (`.variant-section`, `.variant-section-header`, `.variant-section-title`, `.public-settings`). Keep `.form-grid`, `.form-two`, `.modal-actions`, `.field-help` for 18d4. *Done when:* All product modals render identically, build passes.

- [x] **Step 4 - Product-specific CSS cleanup** - remove all product-only CSS rules from App.css that are now migrated: `.product-dot` + colors, `.stock` / `.stock.low`, `.inventory-summary`, `.variant-label`, `.product-section` + children, `.field-error` (scoped), `.input-error` (empty), `.variant-list` through `.variant-add-btn`, `.variant-edit-*`, `.product-preview-*`, `.category-row` / `.category-selector`, `.category-add-row` through `.category-list-select`, `.option-type-list` through `.option-value-add-row`, `.form-two`, `.variant-options` / `.option-selection-row` / `.option-add-btn`, `.public-description-gap`. Update App.css header comment. *Done when:* `npm run build` passes, `npm run lint` passes, no product-only class references remain in App.css.

## Files / areas

- `src/features/products/ProductsPage.tsx` - convert product-specific classes
- `src/features/products/ProductCreatePage.tsx` - convert product-specific classes
- `src/features/products/ProductModal.tsx` - convert product-specific classes
- `src/features/products/CategoryManagerModal.tsx` - convert category classes
- `src/features/products/OptionTypeManagerModal.tsx` - convert option type classes
- `src/features/products/VariantManagerModal.tsx` - convert variant form classes
- `src/features/products/VariantModal.tsx` - convert variant form classes
- `src/App.css` - remove migrated product-only rules

## Data / contracts

- No schema or API changes. This is a styling-only migration.
- All page props and component interfaces remain unchanged.

## Testing

- Verify with build: `npm run build` must pass after each step
- Verify with lint: `npm run lint` must pass after each step
- Visual verification: product pages and modals should render identically before and after
- Existing product tests should continue to pass (no class-name queries in product tests)

## Notes for the AI

- Shared classes (`.page-section`, `.section-intro`, `.form-grid`, `.modal-actions`, `.panel`, `.field-help`, `.checkbox-label`, `.settings-section-divider`, `.settings-layout`, table styles) are NOT migrated in this spec. Leave them as CSS class references. They will be migrated in 18d4.
- `.eyebrow` has NO CSS definition - it is unstyled. Replace with Tailwind inline classes where used.
- `.input-error` has an empty CSS body - replace with Tailwind inline classes.
- The product preview panel uses a `settings-layout` grid (two columns: form + preview). This is shared with SettingsPage - keep it for 18d4.
- `.variant-list-item` has a hover state in the original CSS. Add `hover:bg-[#f3eef4]` or similar.
- The `.product-dot` colors (coral, mint, sky, lavender) are used as color variants on the product list. Map each to Tailwind color classes.
- Run `npm run build` and `npm run lint` after each step to verify.
