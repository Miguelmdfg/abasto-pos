create or replace function public.open_cashier_shift(
  p_code text,
  p_initial_amount_bs numeric default 0,
  p_initial_amount_usd numeric default 0
)
returns public.cashier_shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_shift public.cashier_shifts;
begin
  select * into v_profile
  from public.profiles
  where id = auth.uid() and active;

  if not found then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;

  if p_initial_amount_bs < 0 or p_initial_amount_usd < 0 then
    raise exception 'INITIAL_AMOUNT_CANNOT_BE_NEGATIVE';
  end if;

  insert into public.cashier_shifts (
    code,
    cashier_id,
    initial_amount_bs,
    initial_amount_usd
  ) values (
    p_code,
    v_profile.id,
    p_initial_amount_bs,
    p_initial_amount_usd
  ) returning * into v_shift;

  return v_shift;
exception
  when unique_violation then
    raise exception 'OPEN_SHIFT_ALREADY_EXISTS_OR_CODE_USED';
end;
$$;

grant execute on function public.open_cashier_shift(text, numeric, numeric) to authenticated;

create or replace function public.create_sale(
  p_code text,
  p_items jsonb,
  p_payments jsonb,
  p_exchange_rate_bcv numeric,
  p_exchange_rate_paralelo numeric default null,
  p_customer_id uuid default null,
  p_credit_note_id uuid default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_shift public.cashier_shifts;
  v_sale public.sales;
  v_item jsonb;
  v_payment jsonb;
  v_product public.products;
  v_price public.product_price_history;
  v_cost public.product_cost_history;
  v_product_id uuid;
  v_quantity numeric;
  v_stock numeric;
  v_line_total numeric;
  v_line_net numeric;
  v_line_iva numeric;
  v_subtotal_net numeric := 0;
  v_iva_amount numeric := 0;
  v_total numeric := 0;
  v_payment_total numeric := 0;
  v_method public.payment_method_code;
  v_currency public.currency_code;
  v_amount numeric;
  v_amount_bs numeric;
  v_exchange_rate numeric;
  v_has_credit_payment boolean := false;
  v_credit_balance numeric;
  v_credit_limit numeric;
  v_customer_id uuid;
begin
  if p_exchange_rate_bcv is null or p_exchange_rate_bcv <= 0 then
    raise exception 'VALID_BCV_RATE_REQUIRED';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'SALE_REQUIRES_ITEMS';
  end if;

  if jsonb_typeof(p_payments) <> 'array' or jsonb_array_length(p_payments) = 0 then
    raise exception 'SALE_REQUIRES_PAYMENTS';
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

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'INVALID_ITEM_QUANTITY';
    end if;

    select * into v_product
    from public.products
    where id = v_product_id and active
    for update;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND: %', v_product_id;
    end if;

    select * into v_price
    from public.product_price_history
    where product_id = v_product_id and valid_to is null
    order by valid_from desc
    limit 1;

    if not found then
      raise exception 'PRODUCT_PRICE_NOT_CONFIGURED: %', v_product_id;
    end if;

    select * into v_cost
    from public.product_cost_history
    where product_id = v_product_id and valid_to is null
    order by valid_from desc
    limit 1;

    select coalesce(sum(quantity), 0) into v_stock
    from public.inventory_movements
    where product_id = v_product_id;

    if v_stock < v_quantity then
      raise exception 'INSUFFICIENT_STOCK:%:%', v_product_id, v_stock;
    end if;

    v_line_total := round(v_price.price_bs * v_quantity, 2);
    v_line_net := round(v_line_total / (1 + v_product.iva_rate / 100), 2);
    v_line_iva := round(v_line_total - v_line_net, 2);
    v_subtotal_net := v_subtotal_net + v_line_net;
    v_iva_amount := v_iva_amount + v_line_iva;
    v_total := v_total + v_line_total;
  end loop;

  for v_payment in select value from jsonb_array_elements(p_payments)
  loop
    v_method := (v_payment->>'method')::public.payment_method_code;
    v_currency := (v_payment->>'currency')::public.currency_code;
    v_amount := (v_payment->>'amount')::numeric;
    v_amount_bs := (v_payment->>'amount_bs')::numeric;
    v_exchange_rate := nullif((v_payment->>'exchange_rate_snapshot')::numeric, 0);

    if v_amount is null or v_amount <= 0 or v_amount_bs is null or v_amount_bs <= 0 then
      raise exception 'INVALID_PAYMENT_AMOUNT';
    end if;

    if v_currency = 'USD' and (v_exchange_rate is null or v_exchange_rate <= 0) then
      raise exception 'USD_PAYMENT_REQUIRES_EXCHANGE_RATE';
    end if;

    if v_method in ('PAGO_MOVIL', 'PUNTO_VENTA', 'TRANSFERENCIA')
      and nullif(trim(v_payment->>'reference'), '') is null then
      raise exception 'PAYMENT_REFERENCE_REQUIRED';
    end if;

    if v_method = 'NOTA_CREDITO' then
      v_has_credit_payment := true;
    end if;

    v_payment_total := v_payment_total + v_amount_bs;
  end loop;

  if abs(v_payment_total - v_total) > 0.01 then
    raise exception 'PAYMENT_TOTAL_MISMATCH:%:%', v_total, v_payment_total;
  end if;

  if v_has_credit_payment then
    if p_customer_id is null or p_credit_note_id is null then
      raise exception 'CREDIT_PAYMENT_REQUIRES_CUSTOMER_AND_NOTE';
    end if;

    select credit_limit_bs into v_credit_limit
    from public.customers
    where id = p_customer_id and active;

    if not found then
      raise exception 'CUSTOMER_NOT_FOUND';
    end if;

    select coalesce(sum(balance_bs), 0) into v_credit_balance
    from public.credit_note_balances
    where customer_id = p_customer_id;

    if not exists (
      select 1
      from public.credit_notes
      where id = p_credit_note_id and customer_id = p_customer_id
    ) then
      raise exception 'CREDIT_NOTE_NOT_FOUND_FOR_CUSTOMER';
    end if;

    if coalesce(v_credit_balance, 0) + v_total > v_credit_limit then
      raise exception 'CREDIT_LIMIT_REQUIRES_OWNER_AUTHORIZATION';
    end if;
  elsif p_credit_note_id is not null then
    raise exception 'CREDIT_NOTE_ONLY_ALLOWED_WITH_CREDIT_PAYMENT';
  end if;

  insert into public.sales (
    code,
    shift_id,
    cashier_id,
    customer_id,
    credit_note_id,
    total_bs,
    subtotal_net_bs,
    iva_amount_bs,
    exchange_rate_bcv,
    exchange_rate_paralelo
  ) values (
    p_code,
    v_shift.id,
    v_profile.id,
    p_customer_id,
    p_credit_note_id,
    v_total,
    v_subtotal_net,
    v_iva_amount,
    p_exchange_rate_bcv,
    p_exchange_rate_paralelo
  ) returning * into v_sale;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;

    select * into v_product
    from public.products
    where id = v_product_id;

    select * into v_price
    from public.product_price_history
    where product_id = v_product_id and valid_to is null
    order by valid_from desc
    limit 1;

    select * into v_cost
    from public.product_cost_history
    where product_id = v_product_id and valid_to is null
    order by valid_from desc
    limit 1;

    v_line_total := round(v_price.price_bs * v_quantity, 2);
    v_line_net := round(v_line_total / (1 + v_product.iva_rate / 100), 2);
    v_line_iva := round(v_line_total - v_line_net, 2);

    insert into public.sale_items (
      sale_id,
      product_id,
      price_history_id,
      cost_history_id,
      name_snapshot,
      quantity,
      unit_price_bs,
      iva_rate,
      iva_amount_bs,
      subtotal_net_bs
    ) values (
      v_sale.id,
      v_product_id,
      v_price.id,
      v_cost.id,
      v_product.name,
      v_quantity,
      v_price.price_bs,
      v_product.iva_rate,
      v_line_iva,
      v_line_net
    );

    insert into public.inventory_movements (
      product_id,
      movement_type,
      quantity,
      reason,
      reference_type,
      reference_id,
      created_by
    ) values (
      v_product_id,
      'venta',
      -v_quantity,
      'Venta ' || v_sale.code,
      'sale',
      v_sale.id,
      v_profile.id
    );
  end loop;

  for v_payment in select value from jsonb_array_elements(p_payments)
  loop
    insert into public.sale_payments (
      sale_id,
      method,
      amount,
      currency,
      amount_bs,
      exchange_rate_snapshot,
      reference,
      bank,
      created_by
    ) values (
      v_sale.id,
      (v_payment->>'method')::public.payment_method_code,
      (v_payment->>'amount')::numeric,
      (v_payment->>'currency')::public.currency_code,
      (v_payment->>'amount_bs')::numeric,
      nullif((v_payment->>'exchange_rate_snapshot')::numeric, 0),
      nullif(trim(v_payment->>'reference'), ''),
      nullif(trim(v_payment->>'bank'), ''),
      v_profile.id
    );
  end loop;

  return v_sale;
end;
$$;

grant execute on function public.create_sale(text, jsonb, jsonb, numeric, numeric, uuid, uuid) to authenticated;

comment on function public.create_sale is 'Operacion atomica de venta: valida turno, stock, pagos, IVA, credito y registra movimientos.';
