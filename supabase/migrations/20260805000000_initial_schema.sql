-- Yapper v1.0 - migración inicial de baseline
-- Esta migración restablece las tablas de Yapper para reproducir el baseline
-- limpio de desarrollo. No editarla ni volver a aplicarla en el proyecto remoto;
-- las modificaciones posteriores deben ser migraciones incrementales.

create extension if not exists "pgcrypto";

-- Elimina funciones antiguas antes de reemplazar tablas y firmas RPC.
drop function if exists public.get_public_catalog(text);
drop function if exists public.sales_aggregates(text);
drop function if exists public.create_order(uuid, jsonb, text);
drop function if exists public.update_order_status(uuid, text);
drop function if exists public.update_order_payment(uuid, text);
drop function if exists public.cancel_order(uuid);
drop function if exists public.adjust_product_stock(uuid, integer);
drop function if exists public.adjust_product_stock(uuid, integer, integer);
drop function if exists public.update_product_atomic(uuid, text, text, numeric, integer);
drop function if exists public.update_product_atomic(uuid, text, text, numeric, integer, boolean, text, text);
drop function if exists public.validate_order_item_owner();

drop table if exists public.business_settings cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.clients cascade;
drop table if exists public.products cascade;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '',
  category text not null default 'General',
  price numeric(10, 2) not null check (price >= 0),
  cost numeric(10, 2) not null default 0 check (cost >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  published boolean not null default false,
  public_description text not null default '' check (char_length(public_description) <= 240),
  image_url text check (image_url is null or image_url ~* '^https://[^[:space:]]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  phone text not null default '',
  address text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'delivered', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  total numeric(10, 2) not null default 0 check (total >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0)
);

create table public.business_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default 'Mi negocio' check (char_length(business_name) between 2 and 120),
  currency text not null default 'MXN' check (currency in ('MXN', 'USD', 'CAD')),
  low_stock_threshold integer not null default 5 check (low_stock_threshold between 0 and 10000),
  public_catalog_enabled boolean not null default false,
  public_slug text not null default '' check (public_slug = '' or public_slug ~ '^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$'),
  whatsapp_number text not null default '' check (whatsapp_number = '' or whatsapp_number ~ '^52[0-9]{10}$'),
  public_intro text not null default '' check (char_length(public_intro) <= 500),
  updated_at timestamptz not null default now()
);

create index products_user_id_idx on public.products(user_id);
create index clients_user_id_idx on public.clients(user_id);
create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index order_items_order_id_idx on public.order_items(order_id);
create unique index business_settings_public_slug_idx on public.business_settings(public_slug)
  where public_catalog_enabled and public_slug <> '';

create or replace function public.validate_order_item_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.orders o
    join public.products p on p.user_id = o.user_id
    where o.id = new.order_id and p.id = new.product_id
  ) then
    raise exception 'Order item must use a product owned by the order owner';
  end if;
  return new;
end;
$$;

create trigger validate_order_item_owner
before insert or update on public.order_items
for each row execute function public.validate_order_item_owner();

alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.business_settings enable row level security;

create policy "Users read their products" on public.products for select using (auth.uid() = user_id);
create policy "Users insert their products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users update product details" on public.products for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete their products" on public.products for delete using (auth.uid() = user_id);
create policy "Users manage their clients" on public.clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read their orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users read their order items" on public.order_items for select using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "Users manage their settings" on public.business_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Crea un pedido, valida pertenencia y stock, y descuenta existencias atomically.
create or replace function public.create_order(p_client_id uuid, p_items jsonb, p_payment_status text default 'pending')
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_total numeric(10, 2) := 0;
  v_price numeric(10, 2);
  v_stock integer;
  v_item record;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Order must contain at least one product'; end if;
  if p_payment_status not in ('pending', 'paid') then raise exception 'Invalid payment status'; end if;
  if p_client_id is not null and not exists (select 1 from public.clients where id = p_client_id and user_id = v_user_id) then raise exception 'Client not found'; end if;
  if (select count(*) from jsonb_to_recordset(p_items) as items(product_id uuid, quantity integer)) != (select count(distinct product_id) from jsonb_to_recordset(p_items) as items(product_id uuid, quantity integer)) then raise exception 'A product cannot be repeated in the same order'; end if;

  for v_item in select * from jsonb_to_recordset(p_items) as items(product_id uuid, quantity integer) order by product_id loop
    if v_item.quantity is null or v_item.quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;
    select price, stock into v_price, v_stock from public.products where id = v_item.product_id and user_id = v_user_id for update;
    if not found then raise exception 'Product not found'; end if;
    if v_stock < v_item.quantity then raise exception 'Insufficient stock'; end if;
    v_total := v_total + (v_price * v_item.quantity);
  end loop;

  insert into public.orders (user_id, client_id, payment_status, total) values (v_user_id, p_client_id, p_payment_status, v_total) returning id into v_order_id;
  for v_item in select * from jsonb_to_recordset(p_items) as items(product_id uuid, quantity integer) loop
    select price into v_price from public.products where id = v_item.product_id and user_id = v_user_id;
    insert into public.order_items (order_id, product_id, quantity, unit_price) values (v_order_id, v_item.product_id, v_item.quantity, v_price);
    update public.products set stock = stock - v_item.quantity, updated_at = now() where id = v_item.product_id and user_id = v_user_id;
  end loop;
  return v_order_id;
end;
$$;

create or replace function public.update_order_status(p_order_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or p_status not in ('pending', 'delivered') then raise exception 'Invalid order status'; end if;
  update public.orders set status = p_status, delivered_at = case when p_status = 'delivered' then now() else null end where id = p_order_id and user_id = auth.uid() and status <> 'cancelled';
  if not found then raise exception 'Order not found'; end if;
end;
$$;

create or replace function public.update_order_payment(p_order_id uuid, p_payment_status text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or p_payment_status not in ('pending', 'paid') then raise exception 'Invalid payment status'; end if;
  update public.orders set payment_status = p_payment_status where id = p_order_id and user_id = auth.uid() and status <> 'cancelled';
  if not found then raise exception 'Order not found'; end if;
end;
$$;

create or replace function public.cancel_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user_id uuid := auth.uid(); v_item record;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.orders set status = 'cancelled', delivered_at = null where id = p_order_id and user_id = v_user_id and status <> 'cancelled';
  if not found then raise exception 'Order not found or already cancelled'; end if;
  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id order by product_id loop
    update public.products set stock = stock + v_item.quantity, updated_at = now() where id = v_item.product_id and user_id = v_user_id;
    if not found then raise exception 'Product no longer belongs to this account'; end if;
  end loop;
end;
$$;

create or replace function public.adjust_product_stock(p_product_id uuid, p_stock integer default null, p_delta integer default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_current_stock integer; v_next_stock integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if (p_stock is null) = (p_delta is null) then raise exception 'Provide either an absolute stock or a delta'; end if;
  select stock into v_current_stock from public.products where id = p_product_id and user_id = auth.uid() for update;
  if not found then raise exception 'Product not found'; end if;
  v_next_stock := coalesce(p_stock, v_current_stock + p_delta);
  if v_next_stock < 0 then raise exception 'Stock must be a non-negative integer'; end if;
  update public.products set stock = v_next_stock, updated_at = now() where id = p_product_id and user_id = auth.uid();
end;
$$;

create or replace function public.update_product_atomic(p_product_id uuid, p_name text, p_category text, p_price numeric, p_stock integer, p_published boolean default false, p_public_description text default '', p_image_url text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 120 then raise exception 'Invalid product name'; end if;
  if p_category is null or char_length(p_category) = 0 then raise exception 'Invalid product category'; end if;
  if p_price is null or p_price < 0 then raise exception 'Invalid product price'; end if;
  if p_stock is null or p_stock < 0 then raise exception 'Invalid product stock'; end if;
  if char_length(coalesce(p_public_description, '')) > 240 then raise exception 'Description too long'; end if;
  if p_image_url is not null and btrim(p_image_url) <> '' and btrim(p_image_url) !~* '^https://[^[:space:]]+$' then raise exception 'Image URL must use HTTPS'; end if;
  update public.products set name = btrim(p_name), category = p_category, price = p_price, stock = p_stock, published = coalesce(p_published, false), public_description = coalesce(p_public_description, ''), image_url = nullif(btrim(coalesce(p_image_url, '')), ''), updated_at = now() where id = p_product_id and user_id = auth.uid();
  if not found then raise exception 'Product not found'; end if;
end;
$$;

create or replace function public.sales_aggregates(p_period text default '7d')
returns table(label text, total numeric, orders bigint)
language sql security invoker set search_path = public as $$
  select case when p_period = '6m' then to_char(date_trunc('month', created_at), 'Mon') else to_char(created_at::date, 'DD Mon') end, coalesce(sum(total), 0), count(*)
  from public.orders
  where user_id = auth.uid() and payment_status = 'paid' and created_at >= case when p_period = '6m' then now() - interval '6 months' else now() - interval '7 days' end and status <> 'cancelled'
  group by 1, case when p_period = '6m' then date_trunc('month', created_at) else created_at::date end
  order by case when p_period = '6m' then date_trunc('month', created_at) else created_at::date end;
$$;

create or replace function public.get_public_catalog(p_slug text)
returns table(business_name text, currency text, whatsapp_number text, public_intro text, products jsonb)
language sql security definer set search_path = public, pg_temp as $$
  select s.business_name, s.currency, s.whatsapp_number, s.public_intro,
    coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'category', p.category, 'price', p.price, 'publicDescription', p.public_description, 'imageUrl', case when p.image_url ~* '^https://[^[:space:]]+$' then p.image_url else null end, 'color', case when p.id::text like '%0' then 'mint' else 'sky' end) order by p.created_at desc) from public.products p where p.user_id = s.user_id and p.published = true), '[]'::jsonb)
  from public.business_settings s
  where s.public_catalog_enabled = true and s.public_slug = lower(btrim(p_slug))
  limit 1;
$$;

-- Secure default privileges. Product stock changes only through trusted RPCs.
revoke all on public.products from authenticated, anon;
grant select, insert, delete on public.products to authenticated;
grant update (name, category, price, published, public_description, image_url) on public.products to authenticated;
revoke execute on function public.validate_order_item_owner() from public, anon, authenticated;
revoke all on function public.create_order(uuid, jsonb, text) from public;
grant execute on function public.create_order(uuid, jsonb, text) to authenticated;
revoke all on function public.update_order_status(uuid, text) from public;
grant execute on function public.update_order_status(uuid, text) to authenticated;
revoke all on function public.update_order_payment(uuid, text) from public;
grant execute on function public.update_order_payment(uuid, text) to authenticated;
revoke all on function public.cancel_order(uuid) from public;
grant execute on function public.cancel_order(uuid) to authenticated;
revoke all on function public.adjust_product_stock(uuid, integer, integer) from public;
grant execute on function public.adjust_product_stock(uuid, integer, integer) to authenticated;
revoke all on function public.update_product_atomic(uuid, text, text, numeric, integer, boolean, text, text) from public;
grant execute on function public.update_product_atomic(uuid, text, text, numeric, integer, boolean, text, text) to authenticated;
revoke all on function public.sales_aggregates(text) from public;
grant execute on function public.sales_aggregates(text) to authenticated;
revoke all on function public.get_public_catalog(text) from public;
grant execute on function public.get_public_catalog(text) to anon, authenticated;
