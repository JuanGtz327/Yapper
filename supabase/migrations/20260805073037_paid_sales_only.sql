-- Sales and dashboard aggregates count collected revenue only.
create or replace function public.sales_aggregates(p_period text default '7d')
returns table(label text, total numeric, orders bigint)
language sql
security invoker
set search_path = public
as $$
  select
    case
      when p_period = '6m' then to_char(date_trunc('month', created_at), 'Mon')
      else to_char(created_at::date, 'DD Mon')
    end,
    coalesce(sum(total), 0),
    count(*)
  from public.orders
  where user_id = auth.uid()
    and payment_status = 'paid'
    and status <> 'cancelled'
    and created_at >= case
      when p_period = '6m' then now() - interval '6 months'
      else now() - interval '7 days'
    end
  group by 1, case
    when p_period = '6m' then date_trunc('month', created_at)
    else created_at::date
  end
  order by case
    when p_period = '6m' then date_trunc('month', created_at)
    else created_at::date
  end;
$$;

revoke all on function public.sales_aggregates(text) from public;
grant execute on function public.sales_aggregates(text) to authenticated;
