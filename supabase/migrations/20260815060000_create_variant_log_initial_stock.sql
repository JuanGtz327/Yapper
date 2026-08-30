-- 11. Fix create_variant to log initial stock as first restock entry
create or replace function public.create_variant(
  p_product_id uuid,
  p_sku text,
  p_variant_name text,
  p_inventory_cost numeric,
  p_sale_price numeric,
  p_stock integer,
  p_option_value_ids uuid[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_val_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.products where id = p_product_id and user_id = auth.uid()
  ) then raise exception 'Product not found'; end if;
  if p_sku is null or char_length(btrim(p_sku)) < 1 then raise exception 'SKU is required'; end if;
  if p_sale_price is null or p_sale_price < 0 then raise exception 'Invalid sale price'; end if;
  if p_stock is null or p_stock < 0 then raise exception 'Invalid stock'; end if;

  insert into public.product_variants (
    product_id, user_id, sku, name, inventory_cost, sale_price, stock
  ) values (
    p_product_id, auth.uid(), btrim(p_sku), coalesce(p_variant_name, ''),
    coalesce(p_inventory_cost, 0), p_sale_price, p_stock
  ) returning id into v_id;

  foreach v_val_id in array p_option_value_ids loop
    insert into public.variant_option_values (variant_id, option_value_id)
    values (v_id, v_val_id);
  end loop;

  -- Log initial stock as first restock entry
  if p_stock > 0 then
    insert into public.variant_restock_history (
      user_id, variant_id, product_id, sku, variant_name,
      quantity, unit_cost, restocked_at
    ) values (
      auth.uid(), v_id, p_product_id, btrim(p_sku), coalesce(p_variant_name, ''),
      p_stock, coalesce(p_inventory_cost, 0), coalesce(now(), now())
    );
  end if;

  return v_id;
end;
$$;
