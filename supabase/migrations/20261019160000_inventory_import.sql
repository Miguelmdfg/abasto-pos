create or replace function public.import_inventory_products(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_product public.products;
  v_stock numeric;
  v_target_stock numeric;
  v_count integer := 0;
  v_code text;
begin
  if not public.is_owner() then
    raise exception 'OWNER_REQUIRED';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) < 1
    or jsonb_array_length(p_rows) > 500 then
    raise exception 'IMPORT_REQUIRES_1_TO_500_ROWS';
  end if;
  if exists (
    select lower(value->>'code')
    from jsonb_array_elements(p_rows)
    group by lower(value->>'code')
    having count(*) > 1
  ) then
    raise exception 'IMPORT_DUPLICATE_PRODUCT_CODES';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_code := nullif(trim(v_row->>'code'), '');
    v_target_stock := (v_row->>'stock')::numeric;
    if v_code is null or nullif(trim(v_row->>'name'), '') is null
      or nullif(trim(v_row->>'category'), '') is null
      or (v_row->>'price_bs')::numeric < 0
      or (v_row->>'cost_bs')::numeric < 0
      or v_target_stock < 0 then
      raise exception 'IMPORT_ROW_INVALID:%', v_code;
    end if;

    select * into v_product from public.products
    where lower(code) = lower(v_code)
    order by code
    limit 1
    for update;
    if found then
      select coalesce(current_quantity, 0) into v_stock
      from public.product_stock where product_id = v_product.id;
      perform public.upsert_product(
        v_product.id, null, v_row->>'name', v_row->>'category',
        (v_row->>'price_bs')::numeric, (v_row->>'cost_bs')::numeric, 0
      );
      if v_target_stock <> coalesce(v_stock, 0) then
        perform public.adjust_product_stock(
          v_product.id,
          v_target_stock - coalesce(v_stock, 0),
          'Importación de inventario',
          case when v_target_stock > coalesce(v_stock, 0)
            then 'ajuste_positivo'::public.inventory_movement_type
            else 'ajuste_negativo'::public.inventory_movement_type
          end
        );
      end if;
    else
      perform public.upsert_product(
        null, v_code, v_row->>'name', v_row->>'category',
        (v_row->>'price_bs')::numeric, (v_row->>'cost_bs')::numeric, v_target_stock
      );
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.import_inventory_products(jsonb) from public, anon;
grant execute on function public.import_inventory_products(jsonb) to authenticated;
