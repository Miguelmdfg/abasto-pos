create or replace function public.list_credit_accounts()
returns table (
  customer_id uuid,
  customer_name text,
  document text,
  phone text,
  credit_limit_bs numeric,
  note_id uuid,
  note_code text,
  issued_at timestamptz,
  charged_bs numeric,
  paid_bs numeric,
  balance_bs numeric,
  sales jsonb,
  payments jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and active
  ) then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;

  return query
  select
    c.id,
    c.name,
    c.document,
    c.phone,
    c.credit_limit_bs,
    cn.id,
    cn.code,
    cn.issued_at,
    coalesce(b.charged_bs, 0),
    coalesce(b.paid_bs, 0),
    coalesce(b.balance_bs, 0),
    coalesce(sales.items, '[]'::jsonb),
    coalesce(payments.items, '[]'::jsonb)
  from public.customers c
  left join public.credit_notes cn on cn.customer_id = c.id
  left join public.credit_note_balances b on b.credit_note_id = cn.id
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'id', s.code,
      'fecha', s.created_at,
      'total', s.total_bs
    ) order by s.created_at) as items
    from public.sales s
    where s.credit_note_id = cn.id and s.status = 'completed'
  ) sales on true
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'id', p.id,
      'fecha', p.received_at,
      'monto', p.amount_bs,
      'nota', p.notes,
      'method', p.method,
      'currency', p.currency
    ) order by p.received_at) as items
    from public.credit_note_payments p
    where p.credit_note_id = cn.id
  ) payments on true
  where c.active
  order by c.name, cn.issued_at;
end;
$$;

create or replace function public.create_credit_customer(
  p_name text,
  p_document text default null,
  p_phone text default null,
  p_credit_limit_bs numeric default 5000
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer public.customers;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and active
  ) then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;
  if nullif(trim(p_name), '') is null then
    raise exception 'CUSTOMER_NAME_REQUIRED';
  end if;
  if p_credit_limit_bs is null or p_credit_limit_bs <= 0 then
    raise exception 'INVALID_CREDIT_LIMIT';
  end if;

  insert into public.customers (name, document, phone, credit_limit_bs)
  values (
    trim(p_name),
    nullif(trim(p_document), ''),
    nullif(trim(p_phone), ''),
    p_credit_limit_bs
  )
  returning * into v_customer;
  return v_customer;
exception
  when unique_violation then
    raise exception 'CUSTOMER_DOCUMENT_ALREADY_EXISTS';
end;
$$;

create or replace function public.create_credit_sale(
  p_code text,
  p_credit_note_code text,
  p_customer_id uuid,
  p_items jsonb,
  p_exchange_rate_bcv numeric,
  p_exchange_rate_paralelo numeric default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_customer public.customers;
  v_note public.credit_notes;
  v_sale public.sales;
  v_total numeric := 0;
  v_item jsonb;
  v_product public.products;
  v_price public.product_price_history;
  v_quantity numeric;
  v_line_total numeric;
begin
  select * into v_profile
  from public.profiles
  where id = auth.uid() and active;
  if not found then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;

  select * into v_customer
  from public.customers
  where id = p_customer_id and active
  for update;
  if not found then
    raise exception 'CUSTOMER_NOT_FOUND';
  end if;

  if nullif(trim(p_credit_note_code), '') is null then
    raise exception 'CREDIT_NOTE_CODE_REQUIRED';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'SALE_REQUIRES_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::numeric;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'INVALID_ITEM_QUANTITY';
    end if;
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid and active;
    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;
    select * into v_price
    from public.product_price_history
    where product_id = v_product.id and valid_to is null
    order by valid_from desc
    limit 1;
    if not found then
      raise exception 'PRODUCT_PRICE_NOT_CONFIGURED';
    end if;
    v_line_total := round(v_price.price_bs * v_quantity, 2);
    v_total := v_total + v_line_total;
  end loop;

  if (
    select coalesce(sum(balance_bs), 0)
    from public.credit_note_balances
    where customer_id = v_customer.id
  ) + v_total > v_customer.credit_limit_bs then
    raise exception 'CREDIT_LIMIT_REQUIRES_OWNER_AUTHORIZATION';
  end if;

  insert into public.credit_notes (code, customer_id, issued_by)
  values (trim(p_credit_note_code), v_customer.id, v_profile.id)
  returning * into v_note;

  v_sale := public.create_sale(
    p_code,
    p_items,
    jsonb_build_array(jsonb_build_object(
      'method', 'NOTA_CREDITO',
      'amount', v_total,
      'currency', 'BS',
      'amount_bs', v_total
    )),
    p_exchange_rate_bcv,
    p_exchange_rate_paralelo,
    v_customer.id,
    v_note.id
  );

  return v_sale;
end;
$$;

create or replace function public.register_credit_note_payment(
  p_credit_note_id uuid,
  p_method public.payment_method_code,
  p_amount numeric,
  p_currency public.currency_code,
  p_amount_bs numeric,
  p_exchange_rate numeric default null,
  p_reference text default null,
  p_bank text default null,
  p_notes text default null
)
returns public.credit_note_payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_shift public.cashier_shifts;
  v_note public.credit_notes;
  v_payment public.credit_note_payments;
  v_balance numeric;
begin
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

  select * into v_note
  from public.credit_notes
  where id = p_credit_note_id
  for update;
  if not found then
    raise exception 'CREDIT_NOTE_NOT_FOUND';
  end if;

  if p_method = 'NOTA_CREDITO' or p_amount is null or p_amount <= 0
    or p_amount_bs is null or p_amount_bs <= 0 then
    raise exception 'INVALID_CREDIT_PAYMENT';
  end if;
  if p_currency <> 'BS' then
    raise exception 'USD_CREDIT_PAYMENTS_NOT_SUPPORTED';
  end if;
  if p_exchange_rate is not null or abs(p_amount - p_amount_bs) > 0.01 then
    raise exception 'INVALID_BS_PAYMENT';
  end if;
  if p_method = 'EFECTIVO_USD' then
    raise exception 'USD_CREDIT_PAYMENTS_NOT_SUPPORTED';
  end if;
  if p_method in ('PAGO_MOVIL', 'PUNTO_VENTA', 'TRANSFERENCIA')
    and nullif(trim(p_reference), '') is null then
    raise exception 'PAYMENT_REFERENCE_REQUIRED';
  end if;

  select balance_bs into v_balance
  from public.credit_note_balances
  where credit_note_id = v_note.id;
  if coalesce(v_balance, 0) < p_amount_bs then
    raise exception 'PAYMENT_EXCEEDS_CREDIT_BALANCE';
  end if;

  insert into public.credit_note_payments (
    credit_note_id, shift_id, amount, currency, amount_bs,
    exchange_rate_snapshot, method, reference, bank, cashier_id, notes
  ) values (
    v_note.id, v_shift.id, p_amount, p_currency, p_amount_bs,
    p_exchange_rate, p_method, nullif(trim(p_reference), ''),
    nullif(trim(p_bank), ''), v_profile.id, nullif(trim(p_notes), '')
  )
  returning * into v_payment;
  return v_payment;
end;
$$;

revoke all on function public.list_credit_accounts() from public, anon, authenticated;
revoke all on function public.create_credit_customer(text, text, text, numeric) from public, anon, authenticated;
revoke all on function public.create_credit_sale(text, text, uuid, jsonb, numeric, numeric) from public, anon, authenticated;
revoke all on function public.register_credit_note_payment(
  uuid, public.payment_method_code, numeric, public.currency_code, numeric, numeric, text, text, text
) from public, anon, authenticated;

grant execute on function public.list_credit_accounts() to authenticated;
grant execute on function public.create_credit_customer(text, text, text, numeric) to authenticated;
grant execute on function public.create_credit_sale(text, text, uuid, jsonb, numeric, numeric) to authenticated;
grant execute on function public.register_credit_note_payment(
  uuid, public.payment_method_code, numeric, public.currency_code, numeric, numeric, text, text, text
) to authenticated;
