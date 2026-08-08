-- Fix: cancel_order must tolerate deleted variants.
-- When a product is deleted, its variants are CASCADE-deleted. If a user later
-- cancels an order that referenced those variants, the stock restoration UPDATE
-- finds no row and previously raised an exception. Now we check whether the
-- variant still exists: if it was deleted (product removed) we skip silently;
-- if it exists but belongs to a different user we still raise the error.

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_item record;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.orders
  set status = 'cancelled', delivered_at = null
  where id = p_order_id and user_id = v_user_id and status <> 'cancelled';
  if not found then raise exception 'Order not found or already cancelled'; end if;

  for v_item in
    select variant_id, quantity
    from public.order_items
    where order_id = p_order_id
    order by variant_id
  loop
    update public.product_variants
    set stock = stock + v_item.quantity, updated_at = now()
    where id = v_item.variant_id and user_id = v_user_id;

    if not found then
      -- Variant was deleted (product removed) → stock already gone, skip
      if exists (select 1 from public.product_variants where id = v_item.variant_id) then
        raise exception 'Variant no longer belongs to this account';
      end if;
    end if;
  end loop;
end;
$$;
