-- ============================================================
-- Drop legacy product columns (price, cost, stock)
-- All inventory data now lives in product_variants
-- ============================================================
alter table public.products drop column if exists price;
alter table public.products drop column if exists cost;
alter table public.products drop column if exists stock;
