-- Fix get_public_catalog: p.price column was dropped in 20260806020000
-- but the RPC still references it as a fallback for product price.
-- Replace p.price with 0 since all pricing now lives in product_variants.
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
          select coalesce(min(pv2.sale_price), 0)
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
