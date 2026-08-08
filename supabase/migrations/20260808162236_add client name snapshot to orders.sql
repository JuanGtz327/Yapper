-- 1. Add client_name_snapshot column to orders
alter table public.orders
  add column client_name_snapshot text not null default '';

-- 2. Update create_order RPC to accept and store client name
create or replace function public.create_order(
  p_client_id uuid,
  p_items jsonb,
  p_payment_status text default 'pending',
  p_client_name text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_total numeric(10, 2) := 0;
  v_variant record;
  v_item record;
  v_order_number text;
  v_max_num bigint;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Order must contain at least one item'; end if;
  if p_payment_status not in ('pending', 'paid') then raise exception 'Invalid payment status'; end if;
  if p_client_id is not null and not exists (
    select 1 from public.clients where id = p_client_id and user_id = v_user_id
  ) then raise exception 'Client not found'; end if;

  -- Validate no duplicate variants
  if (
    select count(*) from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
  ) != (
    select count(distinct variant_id) from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
  ) then
    raise exception 'A variant cannot be repeated in the same order';
  end if;

  -- Validate stock and compute total
  for v_item in
    select * from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
    order by variant_id
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Quantity must be greater than zero';
    end if;
    select pv.id, pv.sale_price, pv.stock, pv.inventory_cost, pv.sku,
           coalesce(pv.name, '') as vname, coalesce(p.name, '') as pname
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = v_item.variant_id and pv.user_id = v_user_id for update;
    if not found then raise exception 'Product variant not found'; end if;
    if v_variant.stock < v_item.quantity then raise exception 'Insufficient stock for variant %', v_variant.sku; end if;
    v_total := v_total + (v_variant.sale_price * v_item.quantity);
  end loop;

  -- Generate order number (advisory lock prevents race conditions)
  perform pg_advisory_xact_lock(('x' || md5(v_user_id::text))::bit(64)::bigint);
  select coalesce(max(nullif(regexp_replace(order_number, '[^0-9]', '', 'g'), '')::bigint), 0)
  into v_max_num from public.orders where user_id = v_user_id;
  v_order_number := 'PED-' || lpad((v_max_num + 1)::text, 6, '0');

  -- Create order
  insert into public.orders (user_id, client_id, payment_status, total, order_number, client_name_snapshot)
  values (v_user_id, p_client_id, p_payment_status, v_total, v_order_number, p_client_name)
  returning id into v_order_id;

  -- Insert items and deduct stock
  for v_item in
    select * from jsonb_to_recordset(p_items) as items(variant_id uuid, quantity integer)
  loop
    select pv.sale_price, pv.stock, pv.inventory_cost, pv.sku,
           coalesce(pv.name, '') as vname, coalesce(p.name, '') as pname
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = v_item.variant_id and pv.user_id = v_user_id;

    insert into public.order_items (
      order_id, product_id, variant_id, quantity, unit_price,
      sku_snapshot, product_name_snapshot, variant_label_snapshot,
      unit_cost_snapshot, line_total
    ) values (
      v_order_id,
      (select product_id from public.product_variants where id = v_item.variant_id),
      v_item.variant_id,
      v_item.quantity,
      v_variant.sale_price,
      v_variant.sku,
      v_variant.pname,
      v_variant.vname,
      v_variant.inventory_cost,
      v_variant.sale_price * v_item.quantity
    );

    update public.product_variants
    set stock = stock - v_item.quantity, updated_at = now()
    where id = v_item.variant_id and user_id = v_user_id;
  end loop;

  return v_order_id;
end;
$$;
