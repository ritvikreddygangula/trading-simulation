-- admin_add_funds: the only way simulated cash enters the system.
-- Called with the signed-in admin's own session (not the service key), and
-- refuses anyone whose profile isn't role = 'admin'. The balance change and
-- the audit row are written in one transaction.

create or replace function public.admin_add_funds(
  p_user_id uuid,
  p_amount numeric,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := auth.uid();
  v_amount numeric(14, 2) := round(p_amount, 2);
  v_balance numeric(14, 2);
  v_event_id bigint;
begin
  if v_admin is null or not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  if v_amount is null or v_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;
  if v_amount > 1000000 then
    raise exception 'AMOUNT_TOO_LARGE';
  end if;

  update public.profiles
    set cash_balance = cash_balance + v_amount
    where id = p_user_id
    returning cash_balance into v_balance;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  insert into public.funding_events (user_id, admin_id, amount, note)
  values (p_user_id, v_admin, v_amount, nullif(trim(p_note), ''))
  returning id into v_event_id;

  return jsonb_build_object('event_id', v_event_id, 'amount', v_amount, 'cash_balance', v_balance);
end;
$$;

revoke all on function public.admin_add_funds(uuid, numeric, text) from public, anon;
grant execute on function public.admin_add_funds(uuid, numeric, text) to authenticated;
