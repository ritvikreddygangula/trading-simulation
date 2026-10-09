-- execute_trade: the only way cash and positions change during trading.
-- Runs as one transaction with the user's profile row locked, so two orders
-- placed at the same moment can't both spend the same cash or shares.
-- Only the server (service role) may call it; the price comes from the
-- server's own market-data request, never from the browser.

create or replace function public.execute_trade(
  p_user_id uuid,
  p_symbol text,
  p_side public.order_side,
  p_quantity numeric,
  p_price numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cash numeric(14, 2);
  v_held numeric(20, 8);
  v_avg numeric(14, 4);
  v_qty numeric(20, 8) := round(p_quantity, 8);
  v_notional numeric(14, 2);
  v_order_id bigint;
  v_remaining numeric(20, 8);
begin
  if v_qty is null or v_qty <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  if p_price is null or p_price <= 0 then
    raise exception 'INVALID_PRICE';
  end if;

  select cash_balance into v_cash
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select quantity, avg_cost into v_held, v_avg
  from public.positions
  where user_id = p_user_id and symbol = p_symbol
  for update;

  if p_side = 'buy' then
    v_notional := round(v_qty * p_price, 2);
    if v_notional < 0.01 then
      raise exception 'ORDER_TOO_SMALL';
    end if;
    if v_notional > v_cash then
      raise exception 'INSUFFICIENT_FUNDS';
    end if;

    update public.profiles set cash_balance = cash_balance - v_notional where id = p_user_id;

    insert into public.positions (user_id, symbol, quantity, avg_cost)
    values (p_user_id, p_symbol, v_qty, v_notional / v_qty)
    on conflict (user_id, symbol) do update
      set avg_cost = (positions.quantity * positions.avg_cost + v_notional)
                     / (positions.quantity + excluded.quantity),
          quantity = positions.quantity + excluded.quantity,
          updated_at = now();

    v_remaining := coalesce(v_held, 0) + v_qty;
  else
    if v_held is null or v_qty > v_held then
      raise exception 'INSUFFICIENT_SHARES';
    end if;

    v_notional := round(v_qty * p_price, 2);
    if v_notional < 0.01 then
      raise exception 'ORDER_TOO_SMALL';
    end if;

    v_remaining := v_held - v_qty;
    if v_remaining = 0 then
      delete from public.positions where user_id = p_user_id and symbol = p_symbol;
    else
      update public.positions
        set quantity = v_remaining, updated_at = now()
        where user_id = p_user_id and symbol = p_symbol;
    end if;

    update public.profiles set cash_balance = cash_balance + v_notional where id = p_user_id;
  end if;

  insert into public.orders (user_id, symbol, side, quantity, price, notional)
  values (p_user_id, p_symbol, p_side, v_qty, p_price, v_notional)
  returning id into v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'quantity', v_qty,
    'price', p_price,
    'notional', v_notional,
    'cash_balance', (select cash_balance from public.profiles where id = p_user_id),
    'position_quantity', v_remaining
  );
end;
$$;

-- Lock it down: only the service role (our server) can execute trades.
revoke all on function public.execute_trade(uuid, text, public.order_side, numeric, numeric) from public, anon, authenticated;
grant execute on function public.execute_trade(uuid, text, public.order_side, numeric, numeric) to service_role;
