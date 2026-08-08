-- Fix: order_items.variant_id had ON DELETE RESTRICT, which blocks product
-- deletion when order_items reference the product's variants. Since snapshot
-- columns (sku_snapshot, product_name_snapshot, variant_label_snapshot, etc.)
-- preserve all historical data, it is safe to SET NULL on the variant FK.
-- This aligns with the existing ON DELETE SET NULL on product_id.

alter table public.order_items
  drop constraint order_items_variant_id_fkey;

alter table public.order_items
  add constraint order_items_variant_id_fkey
  foreign key (variant_id) references public.product_variants(id) on delete set null;
