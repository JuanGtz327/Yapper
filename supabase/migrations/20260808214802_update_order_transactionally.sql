create or replace function public.update_order(
  p_order_id uuid,
  p_client_id uuid,
  p_items jsonb,
  p_payment_status text default 'pending',
  p_client_name text default ''
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_order record;
  v_item record;
  v_old record;
  v_old_quantity integer;
  v_new_quantity integer;
  v_total numeric(10, 2) := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;
  if p_payment_status not in ('pending', 'paid') then
    raise exception 'Invalid payment status';
  end if;
  if p_client_id is not null and not exists (
    select 1 from public.clients where id = p_client_id and user_id = v_user_id
  ) then
    raise exception 'Client not found';
  end if;
  if (
    select count(*) from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
  ) != (
    select count(distinct variant_id) from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
  ) then
    raise exception 'A variant cannot be repeated in the same order';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and user_id = v_user_id
  for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status = 'cancelled' then raise exception 'Cancelled orders cannot be edited'; end if;

  -- Lock every new variant in a stable order before changing stock.
  perform 1
  from public.product_variants
  where id in (
    select variant_id from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
  ) and user_id = v_user_id
  order by id
  for update;
  if exists (
    select 1
    from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
    left join public.product_variants pv on pv.id = items.variant_id and pv.user_id = v_user_id
    where pv.id is null or items.quantity is null or items.quantity <= 0
  ) then
    raise exception 'Invalid product variant or quantity';
  end if;

  -- Return stock for removed or reduced lines first.
  for v_old in
    select variant_id, quantity from public.order_items
    where order_id = p_order_id and variant_id is not null
  loop
    select coalesce((
      select quantity from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
      where items.variant_id = v_old.variant_id
    ), 0) into v_new_quantity;
    if v_new_quantity < v_old.quantity then
      update public.product_variants
      set stock = stock + (v_old.quantity - v_new_quantity), updated_at = now()
      where id = v_old.variant_id and user_id = v_user_id;
    end if;
  end loop;

  -- Deduct stock for added or increased lines and calculate the new total.
  for v_item in
    select items.variant_id, items.quantity, pv.sale_price, oi.unit_price as old_price
    from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
    join public.product_variants pv on pv.id = items.variant_id and pv.user_id = v_user_id
    left join public.order_items oi on oi.order_id = p_order_id and oi.variant_id = items.variant_id
    order by items.variant_id
  loop
    select coalesce((select quantity from public.order_items where order_id = p_order_id and variant_id = v_item.variant_id), 0)
      into v_old_quantity;
    v_new_quantity := v_item.quantity;
    if v_new_quantity > v_old_quantity then
      update public.product_variants
      set stock = stock - (v_new_quantity - v_old_quantity), updated_at = now()
      where id = v_item.variant_id and user_id = v_user_id
        and stock >= (v_new_quantity - v_old_quantity);
      if not found then raise exception 'Insufficient stock for variant %', v_item.variant_id; end if;
    end if;
    v_total := v_total + (coalesce(v_item.old_price, v_item.sale_price) * v_item.quantity);
  end loop;

  update public.orders
  set client_id = p_client_id,
      client_name_snapshot = p_client_name,
      payment_status = p_payment_status,
      total = v_total
  where id = p_order_id;

  delete from public.order_items
  where order_id = p_order_id
    and (variant_id is null or variant_id not in (
      select variant_id from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
    ));

  -- Existing lines retain their historical snapshots and unit prices.
  for v_item in
    select items.variant_id, items.quantity, pv.sale_price, pv.inventory_cost,
           pv.sku, coalesce(pv.name, '') as variant_name, coalesce(p.name, '') as product_name,
           oi.sku_snapshot as old_sku, oi.product_name_snapshot as old_product,
           oi.variant_label_snapshot as old_label, oi.unit_price as old_price,
           oi.unit_cost_snapshot as old_cost
    from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
    join public.product_variants pv on pv.id = items.variant_id and pv.user_id = v_user_id
    join public.products p on p.id = pv.product_id
    left join public.order_items oi on oi.order_id = p_order_id and oi.variant_id = items.variant_id
  loop
    if v_item.old_price is not null then
      update public.order_items
      set quantity = v_item.quantity,
          line_total = v_item.old_price * v_item.quantity
      where order_id = p_order_id and variant_id = v_item.variant_id;
    else
      insert into public.order_items (
        order_id, product_id, variant_id, quantity, unit_price,
        sku_snapshot, product_name_snapshot, variant_label_snapshot,
        unit_cost_snapshot, line_total
      ) values (
        p_order_id,
        (select product_id from public.product_variants where id = v_item.variant_id),
        v_item.variant_id,
        v_item.quantity,
        v_item.sale_price,
        v_item.sku,
        v_item.product_name,
        v_item.variant_name,
        v_item.inventory_cost,
        v_item.sale_price * v_item.quantity
      );
    end if;
  end loop;
end;
$$;

revoke all on function public.update_order(uuid, uuid, jsonb, text, text) from public;
grant execute on function public.update_order(uuid, uuid, jsonb, text, text) to authenticated;
