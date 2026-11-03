revoke execute on function public.adjust_product_stock(uuid, numeric, text, public.inventory_movement_type) from public, anon;
revoke execute on function public.create_sale(text, jsonb, jsonb, numeric, numeric, uuid, uuid) from public, anon;
revoke execute on function public.is_owner() from public, anon;
revoke execute on function public.open_cashier_shift(text, numeric, numeric) from public, anon;
revoke execute on function public.upsert_product(uuid, text, text, text, numeric, numeric, numeric) from public, anon;

grant execute on function public.adjust_product_stock(uuid, numeric, text, public.inventory_movement_type) to authenticated;
grant execute on function public.create_sale(text, jsonb, jsonb, numeric, numeric, uuid, uuid) to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.open_cashier_shift(text, numeric, numeric) to authenticated;
grant execute on function public.upsert_product(uuid, text, text, text, numeric, numeric, numeric) to authenticated;

alter view public.product_stock set (security_invoker = true);
alter view public.credit_note_balances set (security_invoker = true);

create policy sale_payments_read_authenticated on public.sale_payments
for select to authenticated
using (exists (
  select 1 from public.sales s
  where s.id = sale_id and (s.cashier_id = auth.uid() or public.is_owner())
));

create index if not exists cashier_shifts_cashier on public.cashier_shifts (cashier_id);
create index if not exists cashier_shifts_closed_by on public.cashier_shifts (closed_by);
create index if not exists categories_parent on public.categories (parent_id);
create index if not exists credit_note_payments_cashier on public.credit_note_payments (cashier_id);
create index if not exists credit_note_payments_shift on public.credit_note_payments (shift_id);
create index if not exists credit_notes_customer on public.credit_notes (customer_id);
create index if not exists credit_notes_issued_by on public.credit_notes (issued_by);
create index if not exists exchange_rates_created_by on public.exchange_rates (created_by);
create index if not exists inventory_movements_created_by on public.inventory_movements (created_by);
create index if not exists partial_closures_created_by on public.partial_closures (created_by);
create index if not exists partial_closures_shift on public.partial_closures (shift_id);
create index if not exists product_cost_history_created_by on public.product_cost_history (created_by);
create index if not exists product_price_history_created_by on public.product_price_history (created_by);
create index if not exists products_category on public.products (category_id);
create index if not exists sale_items_cost_history on public.sale_items (cost_history_id);
create index if not exists sale_items_price_history on public.sale_items (price_history_id);
create index if not exists sale_items_product on public.sale_items (product_id);
create index if not exists sale_items_sale on public.sale_items (sale_id);
create index if not exists sale_payments_created_by on public.sale_payments (created_by);
create index if not exists sales_credit_note on public.sales (credit_note_id);
create index if not exists sales_customer on public.sales (customer_id);
create index if not exists shift_distributions_recipient on public.shift_distributions (recipient_user_id);
create index if not exists shift_distributions_shift on public.shift_distributions (shift_id);
