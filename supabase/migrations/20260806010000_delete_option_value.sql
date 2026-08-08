-- ============================================================
-- Delete option value RPC
-- ============================================================
create or replace function public.delete_option_value(p_option_value_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.option_values
  where id = p_option_value_id
    and option_type_id in (
      select id from public.option_types where user_id = auth.uid()
    );
  if not found then raise exception 'Option value not found'; end if;
end;
$$;

revoke all on function public.delete_option_value(uuid) from public;
grant execute on function public.delete_option_value(uuid) to authenticated;
