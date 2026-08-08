-- Yapper v2.0 - Product variants, categories, and reusable options
-- This migration adds variant-level inventory, normalised categories,
-- and reusable option types (color, size, capacity, etc.).

-- ============================================================
-- 1. CATEGORIES
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categories_user_name_idx
  on public.categories(user_id, lower(name));

alter table public.categories enable row level security;

create policy "Users manage their categories"
  on public.categories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.categories to authenticated;

-- ============================================================
-- 2. OPTION TYPES  (Color, Talla, Capacidad …)
-- ============================================================
create table public.option_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create unique index option_types_user_name_idx
  on public.option_types(user_id, lower(name));

alter table public.option_types enable row level security;

create policy "Users manage their option types"
  on public.option_types for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, delete on public.option_types to authenticated;

-- ============================================================
-- 3. OPTION VALUES  (Negro, Azul, M, L, 128 GB …)
-- ============================================================
create table public.option_values (
  id uuid primary key default gen_random_uuid(),
  option_type_id uuid not null references public.option_types(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create unique index option_values_type_name_idx
  on public.option_values(option_type_id, lower(name));

-- RLS: users can manage option values through option types they own
alter table public.option_values enable row level security;

create policy "Users manage their option values"
  on public.option_values for all
  using (exists (
    select 1 from public.option_types ot
    where ot.id = option_values.option_type_id and ot.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.option_types ot
    where ot.id = option_values.option_type_id and ot.user_id = auth.uid()
  ));

grant select, insert, delete on public.option_values to authenticated;

-- ============================================================
-- 4. PRODUCT VARIANTS
-- ============================================================
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null check (char_length(sku) between 1 and 40),
  name text not null default '' check (char_length(name) <= 120),
  inventory_cost numeric(10, 2) not null default 0 check (inventory_cost >= 0),
  sale_price numeric(10, 2) not null check (sale_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index product_variants_user_sku_idx
  on public.product_variants(user_id, lower(sku));

create index product_variants_product_id_idx
  on public.product_variants(product_id);

alter table public.product_variants enable row level security;

create policy "Users read their product variants"
  on public.product_variants for select
  using (auth.uid() = user_id);

create policy "Users insert their product variants"
  on public.product_variants for insert
  with check (auth.uid() = user_id);

create policy "Users update product variants"
  on public.product_variants for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users delete their product variants"
  on public.product_variants for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.product_variants to authenticated;

-- ============================================================
-- 5. VARIANT ↔ OPTION VALUES  (many-to-many)
-- ============================================================
create table public.variant_option_values (
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  option_value_id uuid not null references public.option_values(id) on delete cascade,
  primary key (variant_id, option_value_id)
);

-- RLS: users can manage through variant ownership
alter table public.variant_option_values enable row level security;

create policy "Users manage their variant option values"
  on public.variant_option_values for all
  using (exists (
    select 1 from public.product_variants pv
    where pv.id = variant_option_values.variant_id and pv.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.product_variants pv
    where pv.id = variant_option_values.variant_id and pv.user_id = auth.uid()
  ));

grant select, insert, delete on public.variant_option_values to authenticated;

-- ============================================================
-- 6. MIGRATE EXISTING DATA
-- ============================================================

-- 6a. Create default categories from existing product.category text
insert into public.categories (user_id, name)
select distinct p.user_id, p.category
from public.products p
where p.category <> ''
on conflict (user_id, lower(name)) do nothing;

-- 6b. Add category_id to products
alter table public.products
  add column category_id uuid references public.categories(id) on delete set null;

-- Populate category_id from the text category
update public.products p
set category_id = c.id
from public.categories c
where c.user_id = p.user_id and lower(c.name) = lower(p.category);

-- 6c. Create default variants for existing products
--     SKU = PROD-<first 8 chars of uuid>
insert into public.product_variants (product_id, user_id, sku, name, inventory_cost, sale_price, stock, low_stock_threshold)
select
  p.id,
  p.user_id,
  'PROD-' || upper(substring(replace(p.id::text, '-', ''), 1, 8)),
  '',
  coalesce(p.cost, 0),
  p.price,
  p.stock,
  p.low_stock_threshold
from public.products p;

-- ============================================================
-- 7. UPDATE ORDER ITEMS  →  reference variant instead of product
-- ============================================================

-- 7a. Add variant_id column and relax product_id FK (snapshots preserve history)
alter table public.order_items
  add column variant_id uuid references public.product_variants(id) on delete restrict;

-- Change product_id FK from RESTRICT to SET NULL so products with historical orders can be deleted
alter table public.order_items
  drop constraint order_items_product_id_fkey;

alter table public.order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;

-- 7b. Add snapshot columns for historical accuracy
alter table public.order_items
  add column sku_snapshot text not null default '',
  add column product_name_snapshot text not null default '',
  add column variant_label_snapshot text not null default '',
  add column unit_cost_snapshot numeric(10, 2) not null default 0,
  add column line_total numeric(10, 2) not null default 0;

-- 7c. Populate from existing data
-- For legacy order_items that reference products, find the first variant
update public.order_items oi
set
  variant_id = pv.id,
  sku_snapshot = pv.sku,
  product_name_snapshot = coalesce(p.name, ''),
  variant_label_snapshot = pv.name,
  unit_cost_snapshot = pv.inventory_cost,
  line_total = oi.unit_price * oi.quantity
from public.product_variants pv
join public.products p on p.id = pv.product_id
where oi.product_id = p.id and oi.variant_id is null;

-- Remove the old product_id column (replace with variant_id as the primary reference)
-- Keep product_id temporarily for backward compatibility during migration
-- We will NOT drop it yet to avoid breaking the RPC functions that still reference it.

-- 7d. Update validate_order_item_owner trigger to also validate variant ownership
drop trigger if exists validate_order_item_owner on public.order_items;

create or replace function public.validate_order_item_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Validate variant ownership
  if new.variant_id is not null then
    if not exists (
      select 1 from public.product_variants pv
      join public.orders o on o.id = new.order_id and o.user_id = pv.user_id
      where pv.id = new.variant_id
    ) then
      raise exception 'Order item must use a variant owned by the order owner';
    end if;
  end if;
  -- Validate product ownership (backward compatibility)
  if new.product_id is not null then
    if not exists (
      select 1 from public.orders o
      join public.products p on p.user_id = o.user_id
      where o.id = new.order_id and p.id = new.product_id
    ) then
      raise exception 'Order item must use a product owned by the order owner';
    end if;
  end if;
  return new;
end;
$$;

create trigger validate_order_item_owner
before insert or update on public.order_items
for each row execute function public.validate_order_item_owner();

-- ============================================================
-- 8. ADD ORDER NUMBER
-- ============================================================
alter table public.orders
  add column order_number text;

-- Populate order numbers sequentially
do $$
declare
  r record;
  counter bigint := 0;
begin
  for r in select id from public.orders where order_number is null order by created_at loop
    counter := counter + 1;
    update public.orders set order_number = 'PED-' || lpad(counter::text, 6, '0') where id = r.id;
  end loop;
end $$;

-- Enforce uniqueness on order_number after backfill
alter table public.orders
  alter column order_number set not null;

create unique index orders_order_number_unique_idx
  on public.orders(user_id, order_number);

-- ============================================================
-- 9. UPDATE RPCs
-- ============================================================

-- Drop old functions that will be replaced with variant-aware versions
drop function if exists public.create_order(uuid, jsonb, text);
drop function if exists public.cancel_order(uuid);
drop function if exists public.update_product_atomic(uuid, text, text, numeric, integer, boolean, text, text);
drop function if exists public.adjust_product_stock(uuid, integer, integer);

-- 9a. create_order — now accepts variant_id per line item
create or replace function public.create_order(
  p_client_id uuid,
  p_items jsonb,
  p_payment_status text default 'pending'
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
  insert into public.orders (user_id, client_id, payment_status, total, order_number)
  values (v_user_id, p_client_id, p_payment_status, v_total, v_order_number)
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

-- 9b. cancel_order — now restores variant stock
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
    if not found then raise exception 'Variant no longer belongs to this account'; end if;
  end loop;
end;
$$;

-- 9c. update_product_atomic — now also accepts category_id and inventory_cost
create or replace function public.update_product_atomic(
  p_product_id uuid,
  p_name text,
  p_category_id uuid,
  p_published boolean default false,
  p_public_description text default '',
  p_image_url text default null,
  -- variant fields (optional — updates the first/default variant)
  p_sku text default null,
  p_variant_name text default '',
  p_inventory_cost numeric default null,
  p_sale_price numeric default null,
  p_stock integer default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_variant_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 120 then raise exception 'Invalid product name'; end if;
  if char_length(coalesce(p_public_description, '')) > 240 then raise exception 'Description too long'; end if;
  if p_image_url is not null and btrim(p_image_url) <> '' and btrim(p_image_url) !~* '^https://[^[:space:]]+$' then raise exception 'Image URL must use HTTPS'; end if;

  -- Update product
  update public.products set
    name = btrim(p_name),
    category_id = p_category_id,
    published = coalesce(p_published, false),
    public_description = coalesce(p_public_description, ''),
    image_url = nullif(btrim(coalesce(p_image_url, '')), ''),
    updated_at = now()
  where id = p_product_id and user_id = auth.uid();
  if not found then raise exception 'Product not found'; end if;

  -- Update first variant if provided
  if p_sku is not null then
    select id into v_variant_id
    from public.product_variants
    where product_id = p_product_id and user_id = auth.uid()
    order by created_at limit 1;

    if v_variant_id is not null then
      update public.product_variants set
        sku = btrim(p_sku),
        name = coalesce(p_variant_name, ''),
        inventory_cost = coalesce(p_inventory_cost, inventory_cost),
        sale_price = coalesce(p_sale_price, sale_price),
        stock = coalesce(p_stock, stock),
        updated_at = now()
      where id = v_variant_id;
    end if;
  end if;
end;
$$;

-- 9d. adjust_product_stock — now operates on variant
create or replace function public.adjust_product_stock(
  p_variant_id uuid,
  p_stock integer default null,
  p_delta integer default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_stock integer;
  v_next_stock integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if (p_stock is null) = (p_delta is null) then raise exception 'Provide either an absolute stock or a delta'; end if;

  select stock into v_current_stock
  from public.product_variants
  where id = p_variant_id and user_id = auth.uid() for update;
  if not found then raise exception 'Product variant not found'; end if;

  v_next_stock := coalesce(p_stock, v_current_stock + p_delta);
  if v_next_stock < 0 then raise exception 'Stock must be a non-negative integer'; end if;

  update public.product_variants
  set stock = v_next_stock, updated_at = now()
  where id = p_variant_id and user_id = auth.uid();
end;
$$;

-- 9e. Update get_public_catalog to return variants with prices
create or replace function public.get_public_catalog(p_slug text)
returns table(
  business_name text,
  currency text,
  whatsapp_number text,
  public_intro text,
  products jsonb
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    s.business_name,
    s.currency,
    s.whatsapp_number,
    s.public_intro,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'category', coalesce(c.name, p.category),
        'price', (
          select coalesce(min(pv2.sale_price), p.price)
          from public.product_variants pv2
          where pv2.product_id = p.id
        ),
        'publicDescription', p.public_description,
        'imageUrl', case
          when p.image_url ~* '^https://[^[:space:]]+$' then p.image_url
          else null
        end,
        'color', case
          when p.id::text like '%0' then 'mint'
          else 'sky'
        end
      ) order by p.created_at desc)
      from public.products p
      left join public.categories c on c.id = p.category_id
      where p.user_id = s.user_id and p.published = true
    ), '[]'::jsonb)
  from public.business_settings s
  where s.public_catalog_enabled = true and s.public_slug = lower(btrim(p_slug))
  limit 1;
$$;

-- ============================================================
-- 10. UPDATE PRIVILEGES
-- ============================================================

-- Revoke old RPC grants and re-grant updated signatures
revoke all on function public.create_order(uuid, jsonb, text) from public;
grant execute on function public.create_order(uuid, jsonb, text) to authenticated;

revoke all on function public.cancel_order(uuid) from public;
grant execute on function public.cancel_order(uuid) to authenticated;

-- update_product_atomic was already dropped above; grant the new signature directly
grant execute on function public.update_product_atomic(uuid, text, uuid, boolean, text, text, text, text, numeric, numeric, integer) to authenticated;

revoke all on function public.adjust_product_stock(uuid, integer, integer) from public;
grant execute on function public.adjust_product_stock(uuid, integer, integer) to authenticated;

-- ============================================================
-- 11. HELPER: inventory_aggregates  (used by the UI)
-- ============================================================
create or replace function public.inventory_aggregates()
returns table(
  cost_total numeric,
  sale_total numeric,
  profit_total numeric
)
language sql
security invoker
set search_path = public
as $$
  select
    coalesce(sum(pv.stock * pv.inventory_cost), 0)::numeric(12,2),
    coalesce(sum(pv.stock * pv.sale_price), 0)::numeric(12,2),
    coalesce(sum(pv.stock * (pv.sale_price - pv.inventory_cost)), 0)::numeric(12,2)
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where p.user_id = auth.uid();
$$;

revoke all on function public.inventory_aggregates() from public;
grant execute on function public.inventory_aggregates() to authenticated;

-- ============================================================
-- 12. HELPER: category CRUD RPCs
-- ============================================================
create or replace function public.create_category(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(btrim(p_name)) < 1 then raise exception 'Category name required'; end if;
  insert into public.categories (user_id, name)
  values (auth.uid(), btrim(p_name))
  on conflict (user_id, lower(name)) do update set name = btrim(p_name), updated_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.delete_category(p_category_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.categories where id = p_category_id and user_id = auth.uid();
  if not found then raise exception 'Category not found'; end if;
end;
$$;

revoke all on function public.create_category(text) from public;
grant execute on function public.create_category(text) to authenticated;
revoke all on function public.delete_category(uuid) from public;
grant execute on function public.delete_category(uuid) to authenticated;

-- ============================================================
-- 13. HELPER: option type + value CRUD RPCs
-- ============================================================
create or replace function public.create_option_type(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(btrim(p_name)) < 1 then raise exception 'Option type name required'; end if;
  insert into public.option_types (user_id, name)
  values (auth.uid(), btrim(p_name))
  on conflict (user_id, lower(name)) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.option_types where user_id = auth.uid() and lower(name) = lower(btrim(p_name));
  end if;
  return v_id;
end;
$$;

create or replace function public.create_option_value(p_option_type_id uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.option_types where id = p_option_type_id and user_id = auth.uid()
  ) then raise exception 'Option type not found'; end if;
  if p_name is null or char_length(btrim(p_name)) < 1 then raise exception 'Option value name required'; end if;
  insert into public.option_values (option_type_id, name)
  values (p_option_type_id, btrim(p_name))
  on conflict (option_type_id, lower(name)) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.option_values where option_type_id = p_option_type_id and lower(name) = lower(btrim(p_name));
  end if;
  return v_id;
end;
$$;

create or replace function public.delete_option_type(p_option_type_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.option_types where id = p_option_type_id and user_id = auth.uid();
  if not found then raise exception 'Option type not found'; end if;
end;
$$;

revoke all on function public.create_option_type(text) from public;
grant execute on function public.create_option_type(text) to authenticated;
revoke all on function public.create_option_value(uuid, text) from public;
grant execute on function public.create_option_value(uuid, text) to authenticated;
revoke all on function public.delete_option_type(uuid) from public;
grant execute on function public.delete_option_type(uuid) to authenticated;

-- ============================================================
-- 14. VARIANT CRUD RPCs
-- ============================================================
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

  return v_id;
end;
$$;

create or replace function public.update_variant(
  p_variant_id uuid,
  p_sku text,
  p_variant_name text,
  p_inventory_cost numeric,
  p_sale_price numeric,
  p_stock integer,
  p_option_value_ids uuid[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_val_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.product_variants where id = p_variant_id and user_id = auth.uid()
  ) then raise exception 'Variant not found'; end if;
  if p_sku is null or char_length(btrim(p_sku)) < 1 then raise exception 'SKU is required'; end if;

  update public.product_variants set
    sku = btrim(p_sku),
    name = coalesce(p_variant_name, ''),
    inventory_cost = coalesce(p_inventory_cost, inventory_cost),
    sale_price = coalesce(p_sale_price, sale_price),
    stock = coalesce(p_stock, stock),
    updated_at = now()
  where id = p_variant_id;

  -- Replace option values
  delete from public.variant_option_values where variant_id = p_variant_id;
  foreach v_val_id in array p_option_value_ids loop
    insert into public.variant_option_values (variant_id, option_value_id)
    values (p_variant_id, v_val_id);
  end loop;
end;
$$;

create or replace function public.delete_variant(p_variant_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.product_variants where id = p_variant_id and user_id = auth.uid();
  if not found then raise exception 'Variant not found'; end if;
end;
$$;

revoke all on function public.create_variant(uuid, text, text, numeric, numeric, integer, uuid[]) from public;
grant execute on function public.create_variant(uuid, text, text, numeric, numeric, integer, uuid[]) to authenticated;
revoke all on function public.update_variant(uuid, text, text, numeric, numeric, integer, uuid[]) from public;
grant execute on function public.update_variant(uuid, text, text, numeric, numeric, integer, uuid[]) to authenticated;
revoke all on function public.delete_variant(uuid) from public;
grant execute on function public.delete_variant(uuid) to authenticated;
