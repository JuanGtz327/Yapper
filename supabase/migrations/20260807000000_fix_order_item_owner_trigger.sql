-- Fix: allow product deletion when order_items reference the product.
-- The original schema defined order_items.product_id as NOT NULL, but the
-- variants migration changed the FK to ON DELETE SET NULL. PostgreSQL now
-- tries to set product_id to NULL when a product is deleted, which fails
-- because of the NOT NULL constraint. Since variant_id is the primary
-- reference, product_id can safely be nullable for historical records.

alter table public.order_items
  alter column product_id drop not null;

create or replace function public.validate_order_item_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Validate variant ownership
  if new.variant_id is not null then
    if exists (select 1 from public.product_variants pv where pv.id = new.variant_id) then
      -- Variant still exists → enforce ownership
      if not exists (
        select 1 from public.product_variants pv
        join public.orders o on o.id = new.order_id and o.user_id = pv.user_id
        where pv.id = new.variant_id
      ) then
        raise exception 'Order item must use a variant owned by the order owner';
      end if;
    end if;
    -- Variant was CASCADE-deleted (product removal in progress) → allow
  end if;
  -- Validate product ownership (backward compatibility)
  if new.product_id is not null then
    if exists (select 1 from public.products p where p.id = new.product_id) then
      if not exists (
        select 1 from public.orders o
        join public.products p on p.user_id = o.user_id
        where o.id = new.order_id and p.id = new.product_id
      ) then
        raise exception 'Order item must use a product owned by the order owner';
      end if;
    end if;
  end if;
  return new;
end;
$$;
