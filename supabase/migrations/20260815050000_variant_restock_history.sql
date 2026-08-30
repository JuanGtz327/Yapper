-- 10. variant_restock_history — tracks each purchase/restock event
create table public.variant_restock_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null,
  variant_name text not null default '',
  quantity integer not null check (quantity > 0),
  unit_cost numeric(10,2) not null check (unit_cost >= 0),
  restocked_at timestamptz not null default now()
);

create index variant_restock_history_variant_idx
  on public.variant_restock_history (variant_id);

create index variant_restock_history_user_date_idx
  on public.variant_restock_history (user_id, restocked_at desc);

-- RLS
alter table public.variant_restock_history enable row level security;

create policy "Users can view their own restock history"
  on public.variant_restock_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own restock history"
  on public.variant_restock_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own restock history"
  on public.variant_restock_history for delete
  using (auth.uid() = user_id);

-- 10b. restock_variant RPC — adds stock, updates cost, logs history
create or replace function public.restock_variant(
  p_variant_id uuid,
  p_quantity integer,
  p_unit_cost numeric
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_product_id uuid;
  v_sku text;
  v_variant_name text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;
  if p_unit_cost is null or p_unit_cost < 0 then raise exception 'Unit cost must be non-negative'; end if;

  select user_id, product_id, sku, coalesce(name, '')
  into v_user_id, v_product_id, v_sku, v_variant_name
  from public.product_variants
  where id = p_variant_id and user_id = auth.uid();

  if not found then raise exception 'Variant not found'; end if;

  -- Update stock and inventory cost
  update public.product_variants
  set stock = stock + p_quantity,
      inventory_cost = p_unit_cost,
      updated_at = now()
  where id = p_variant_id and user_id = auth.uid();

  -- Log restock event
  insert into public.variant_restock_history (
    user_id, variant_id, product_id, sku, variant_name,
    quantity, unit_cost, restocked_at
  ) values (
    v_user_id, p_variant_id, v_product_id, v_sku, v_variant_name,
    p_quantity, p_unit_cost, now()
  );
end;
$$;

revoke all on function public.restock_variant(uuid, integer, numeric) from public;
grant execute on function public.restock_variant(uuid, integer, numeric) to authenticated;
