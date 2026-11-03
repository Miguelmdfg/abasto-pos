create or replace function public.close_cashier_shift(
  p_counted_amount_bs numeric,
  p_counted_amount_usd numeric,
  p_exchange_rate_bcv numeric
)
returns public.cashier_shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_shift public.cashier_shifts;
  v_expected_bs numeric;
  v_expected_usd numeric;
  v_difference_bs numeric;
begin
  if p_counted_amount_bs is null or p_counted_amount_bs < 0
    or p_counted_amount_usd is null or p_counted_amount_usd < 0 then
    raise exception 'COUNTED_AMOUNT_CANNOT_BE_NEGATIVE';
  end if;
  if p_exchange_rate_bcv is null or p_exchange_rate_bcv <= 0 then
    raise exception 'VALID_BCV_RATE_REQUIRED';
  end if;

  select * into v_profile
  from public.profiles
  where id = auth.uid() and active;

  if not found then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;

  select * into v_shift
  from public.cashier_shifts
  where cashier_id = v_profile.id and status = 'open'
  for update;

  if not found then
    raise exception 'OPEN_SHIFT_REQUIRED';
  end if;

  select
    v_shift.initial_amount_bs + coalesce(sum(case when sp.method = 'EFECTIVO_BS' then sp.amount_bs else 0 end), 0),
    v_shift.initial_amount_usd + coalesce(sum(case when sp.method = 'EFECTIVO_USD' then sp.amount else 0 end), 0)
  into v_expected_bs, v_expected_usd
  from public.sales s
  left join public.sale_payments sp on sp.sale_id = s.id
  where s.shift_id = v_shift.id and s.status = 'completed';

  v_difference_bs := round((p_counted_amount_bs - v_expected_bs) + ((p_counted_amount_usd - v_expected_usd) * p_exchange_rate_bcv), 2);

  update public.cashier_shifts
  set status = 'closed',
      closed_at = now(),
      counted_amount_bs = p_counted_amount_bs,
      counted_amount_usd = p_counted_amount_usd,
      expected_amount_bs = v_expected_bs,
      expected_amount_usd = v_expected_usd,
      difference_bs = v_difference_bs,
      exchange_rate_bcv_at_close = p_exchange_rate_bcv,
      closed_by = v_profile.id,
      updated_at = now()
  where id = v_shift.id
  returning * into v_shift;

  return v_shift;
end;
$$;

grant execute on function public.close_cashier_shift(numeric, numeric, numeric) to authenticated;
revoke execute on function public.close_cashier_shift(numeric, numeric, numeric) from public, anon;

comment on function public.close_cashier_shift is 'Cierra el turno autenticado y calcula la diferencia contra pagos reales del turno.';
