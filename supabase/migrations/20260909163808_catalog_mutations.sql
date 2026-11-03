create or replace function public.upsert_product(
  p_id uuid default null,
  p_code text default null,
  p_name text default null,
  p_category text default null,
  p_price_bs numeric default 0,
  p_cost_bs numeric default 0,
  p_initial_stock numeric default 0
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
  v_category_id uuid;
  v_current_price public.product_price_history;
  v_current_cost public.product_cost_history;
  v_code text;
  v_name text;
  v_category text;
begin
  if not public.is_owner() then
    raise exception 'OWNER_REQUIRED';
  end if;

  v_name := nullif(trim(p_name), '');
  v_category := nullif(trim(p_category), '');
  v_code := nullif(trim(p_code), '');

  if v_name is null or v_category is null then
    raise exception 'PRODUCT_NAME_AND_CATEGORY_REQUIRED';
  end if;
  if p_price_bs is null or p_price_bs < 0 or p_cost_bs is null or p_cost_bs < 0 then
    raise exception 'PRODUCT_PRICE_AND_COST_INVALID';
  end if;
  if p_initial_stock is null or p_initial_stock < 0 then
    raise exception 'PRODUCT_INITIAL_STOCK_INVALID';
  end if;

  insert into public.categories (name)
  values (v_category)
  on conflict (name) do update set active = true
  returning id into v_category_id;

  if v_category_id is null then
    select id into v_category_id from public.categories where name = v_category;
  end if;

  if p_id is null then
    if v_code is null then
      raise exception 'PRODUCT_CODE_REQUIRED';
    end if;

    insert into public.products (code, name, category_id)
    values (v_code, v_name, v_category_id)
    returning * into v_product;

    insert into public.product_price_history (product_id, price_bs, created_by)
    values (v_product.id, p_price_bs, auth.uid());

    insert into public.product_cost_history (product_id, cost_bs, created_by)
    values (v_product.id, p_cost_bs, auth.uid());

    if p_initial_stock > 0 then
      insert into public.inventory_movements (
        product_id, movement_type, quantity, reason, created_by
      ) values (
        v_product.id, 'inventario_inicial', p_initial_stock, 'Inventario inicial', auth.uid()
      );
    end if;
  else
    select * into v_product
    from public.products
    where id = p_id
    for update;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;

    update public.products
    set name = v_name,
        category_id = v_category_id,
        updated_at = now()
    where id = p_id
    returning * into v_product;

    select * into v_current_price
    from public.product_price_history
    where product_id = p_id and valid_to is null
    order by valid_from desc
    limit 1;

    if v_current_price.id is null or v_current_price.price_bs <> p_price_bs then
      update public.product_price_history
      set valid_to = now()
      where id = v_current_price.id;
      insert into public.product_price_history (product_id, price_bs, created_by)
      values (p_id, p_price_bs, auth.uid());
    end if;

    select * into v_current_cost
    from public.product_cost_history
    where product_id = p_id and valid_to is null
    order by valid_from desc
    limit 1;

    if v_current_cost.id is null or v_current_cost.cost_bs <> p_cost_bs then
      update public.product_cost_history
      set valid_to = now()
      where id = v_current_cost.id;
      insert into public.product_cost_history (product_id, cost_bs, created_by)
      values (p_id, p_cost_bs, auth.uid());
    end if;
  end if;

  return v_product;
end;
$$;

grant execute on function public.upsert_product(uuid, text, text, text, numeric, numeric, numeric) to authenticated;

create or replace function public.adjust_product_stock(
  p_product_id uuid,
  p_quantity numeric,
  p_reason text,
  p_movement_type public.inventory_movement_type default 'ajuste_positivo'
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_stock numeric;
  v_next_stock numeric;
begin
  if not public.is_owner() then
    raise exception 'OWNER_REQUIRED';
  end if;
  if p_quantity is null or p_quantity = 0 then
    raise exception 'STOCK_QUANTITY_REQUIRED';
  end if;
  if nullif(trim(p_reason), '') is null then
    raise exception 'STOCK_REASON_REQUIRED';
  end if;
  if p_movement_type not in ('ajuste_positivo', 'ajuste_negativo', 'merma', 'devolucion') then
    raise exception 'INVALID_ADJUSTMENT_TYPE';
  end if;

  perform 1 from public.products where id = p_product_id and active for update;
  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  select coalesce(sum(quantity), 0) into v_current_stock
  from public.inventory_movements
  where product_id = p_product_id;

  v_next_stock := v_current_stock + p_quantity;
  if v_next_stock < 0 then
    raise exception 'INSUFFICIENT_STOCK:%', v_current_stock;
  end if;

  insert into public.inventory_movements (
    product_id, movement_type, quantity, reason, created_by
  ) values (
    p_product_id, p_movement_type, p_quantity, trim(p_reason), auth.uid()
  );

  return v_next_stock;
end;
$$;

grant execute on function public.adjust_product_stock(uuid, numeric, text, public.inventory_movement_type) to authenticated;

comment on function public.upsert_product is 'CRUD de productos para dueño con historial de precio/costo e inventario inicial.';
comment on function public.adjust_product_stock is 'Ajuste de stock auditado, protegido y sin permitir stock negativo.';
