-- 12. Fix create_product_with_variants to log initial stock as restock entries
create or replace function public.create_product_with_variants(
  p_name text,
  p_category_id uuid default null,
  p_published boolean default false,
  p_public_description text default '',
  p_image_url text default null,
  p_variants jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_product_id uuid;
  v_variant jsonb;
  v_variant_id uuid;
  v_val_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 120 then
    raise exception 'Invalid product name';
  end if;
  if char_length(coalesce(p_public_description, '')) > 240 then
    raise exception 'Description too long';
  end if;
  if p_image_url is not null and btrim(p_image_url) <> ''
     and btrim(p_image_url) !~* '^https://[^[:space:]]+$' then
    raise exception 'Image URL must use HTTPS';
  end if;
  if p_variants is null or jsonb_array_length(p_variants) = 0 then
    raise exception 'At least one variant is required';
  end if;

  -- Insert product
  insert into public.products (
    user_id, name, category_id, published, public_description, image_url
  ) values (
    v_user_id,
    btrim(p_name),
    p_category_id,
    coalesce(p_published, false),
    coalesce(p_public_description, ''),
    nullif(btrim(coalesce(p_image_url, '')), '')
  ) returning id into v_product_id;

  -- Insert each variant
  for v_variant in
    select * from jsonb_to_recordset(p_variants) as v(
      sku text,
      variant_name text,
      inventory_cost numeric,
      sale_price numeric,
      stock integer,
      option_value_ids jsonb
    )
  loop
    if v_variant.sku is null or char_length(btrim(v_variant.sku)) < 1 then
      raise exception 'SKU is required for each variant';
    end if;
    if v_variant.sale_price is null or v_variant.sale_price < 0 then
      raise exception 'Invalid sale price for variant %', v_variant.sku;
    end if;
    if v_variant.stock is null or v_variant.stock < 0 then
      raise exception 'Invalid stock for variant %', v_variant.sku;
    end if;

    insert into public.product_variants (
      product_id, user_id, sku, name, inventory_cost, sale_price, stock
    ) values (
      v_product_id, v_user_id,
      btrim(v_variant.sku),
      coalesce(v_variant.variant_name, ''),
      coalesce(v_variant.inventory_cost, 0),
      v_variant.sale_price,
      v_variant.stock
    ) returning id into v_variant_id;

    -- Link option values
    if v_variant.option_value_ids is not null then
      for v_val_id in
        select value::uuid from jsonb_array_elements_text(v_variant.option_value_ids)
      loop
        insert into public.variant_option_values (variant_id, option_value_id)
        values (v_variant_id, v_val_id);
      end loop;
    end if;

    -- Log initial stock as first restock entry
    if v_variant.stock > 0 then
      insert into public.variant_restock_history (
        user_id, variant_id, product_id, sku, variant_name,
        quantity, unit_cost, restocked_at
      ) values (
        v_user_id, v_variant_id, v_product_id,
        btrim(v_variant.sku), coalesce(v_variant.variant_name, ''),
        v_variant.stock, coalesce(v_variant.inventory_cost, 0), now()
      );
    end if;
  end loop;

  return v_product_id;
end;
$$;

revoke all on function public.create_product_with_variants(text, uuid, boolean, text, text, jsonb) from public;
grant execute on function public.create_product_with_variants(text, uuid, boolean, text, text, jsonb) to authenticated;
