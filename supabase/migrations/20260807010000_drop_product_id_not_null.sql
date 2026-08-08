-- Fix: order_items.product_id was declared NOT NULL in the initial schema.
-- The variants migration changed the FK to ON DELETE SET NULL, but forgot to
-- drop the NOT NULL constraint. When a product is deleted, PostgreSQL tries to
-- set product_id → NULL on the referencing order_items and fails with 23502.
-- Since variant_id is now the primary reference, product_id can be nullable.

alter table public.order_items
  alter column product_id drop not null;
