create extension if not exists pgcrypto;

create type public.user_role as enum ('dueno', 'cajero');
create type public.currency_code as enum ('BS', 'USD');
create type public.payment_method_code as enum (
  'EFECTIVO_BS',
  'EFECTIVO_USD',
  'PAGO_MOVIL',
  'PUNTO_VENTA',
  'TRANSFERENCIA',
  'NOTA_CREDITO'
);
create type public.sale_status as enum ('completed');
create type public.inventory_movement_type as enum (
  'compra',
  'venta',
  'ajuste_positivo',
  'ajuste_negativo',
  'merma',
  'devolucion',
  'inventario_inicial'
);
create type public.shift_status as enum ('open', 'closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.user_role not null default 'cajero',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  id smallint primary key default 1 check (id = 1),
  business_name text not null default 'Abasto POS',
  rif text not null default '',
  address text not null default '',
  phone text not null default '',
  iva_default numeric(5, 2) not null default 16 check (iva_default between 0 and 100),
  stock_minimum_global numeric(12, 3) not null default 5 check (stock_minimum_global >= 0),
  overdue_days numeric(5, 0) not null default 30 check (overdue_days > 0),
  due_soon_days numeric(5, 0) not null default 20 check (due_soon_days >= 0),
  credit_limit_default_bs numeric(18, 2) not null default 5000 check (credit_limit_default_bs >= 0),
  exchange_rate_stale_hours numeric(5, 0) not null default 24 check (exchange_rate_stale_hours > 0),
  payment_mobile_bank text not null default '',
  payment_mobile_phone text not null default '',
  payment_mobile_document text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  iva_rate numeric(5, 2) not null default 16 check (iva_rate between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  price_bs numeric(18, 2) not null check (price_bs >= 0),
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from)
);

create unique index product_one_current_price
  on public.product_price_history (product_id)
  where valid_to is null;

create table public.product_cost_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  cost_bs numeric(18, 2) not null check (cost_bs >= 0),
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from)
);

create unique index product_one_current_cost
  on public.product_cost_history (product_id)
  where valid_to is null;

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  rate_type text not null check (rate_type in ('bcv', 'paralelo')),
  value numeric(18, 6) not null check (value > 0),
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from)
);

create unique index exchange_rates_one_current_per_type
  on public.exchange_rates (rate_type)
  where valid_to is null;

create table public.cashier_shifts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  cashier_id uuid not null references public.profiles(id),
  status public.shift_status not null default 'open',
  opened_at timestamptz not null default now(),
  initial_amount_bs numeric(18, 2) not null default 0 check (initial_amount_bs >= 0),
  initial_amount_usd numeric(18, 2) not null default 0 check (initial_amount_usd >= 0),
  closed_at timestamptz,
  counted_amount_bs numeric(18, 2),
  counted_amount_usd numeric(18, 2),
  expected_amount_bs numeric(18, 2),
  expected_amount_usd numeric(18, 2),
  difference_bs numeric(18, 2),
  exchange_rate_bcv_at_close numeric(18, 6),
  closed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'open' and closed_at is null) or (status = 'closed' and closed_at is not null))
);

create unique index one_open_shift_per_cashier
  on public.cashier_shifts (cashier_id)
  where status = 'open';

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text unique,
  phone text,
  email text,
  credit_limit_bs numeric(18, 2) not null check (credit_limit_bs >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  shift_id uuid not null references public.cashier_shifts(id),
  cashier_id uuid not null references public.profiles(id),
  customer_id uuid references public.customers(id) on delete set null,
  credit_note_id uuid,
  status public.sale_status not null default 'completed',
  total_bs numeric(18, 2) not null check (total_bs >= 0),
  subtotal_net_bs numeric(18, 2) not null default 0 check (subtotal_net_bs >= 0),
  iva_amount_bs numeric(18, 2) not null default 0 check (iva_amount_bs >= 0),
  exchange_rate_bcv numeric(18, 6) not null check (exchange_rate_bcv > 0),
  exchange_rate_paralelo numeric(18, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_id uuid not null references public.customers(id),
  issued_by uuid not null references public.profiles(id),
  issued_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sales
  add constraint sales_credit_note_fk
  foreign key (credit_note_id) references public.credit_notes(id) on delete set null;

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  price_history_id uuid not null references public.product_price_history(id),
  cost_history_id uuid references public.product_cost_history(id),
  name_snapshot text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price_bs numeric(18, 2) not null check (unit_price_bs >= 0),
  iva_rate numeric(5, 2) not null check (iva_rate between 0 and 100),
  iva_amount_bs numeric(18, 2) not null default 0 check (iva_amount_bs >= 0),
  subtotal_net_bs numeric(18, 2) not null default 0 check (subtotal_net_bs >= 0),
  created_at timestamptz not null default now()
);

create table public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  method public.payment_method_code not null,
  amount numeric(18, 2) not null check (amount > 0),
  currency public.currency_code not null,
  amount_bs numeric(18, 2) not null check (amount_bs > 0),
  exchange_rate_snapshot numeric(18, 6) check (exchange_rate_snapshot is null or exchange_rate_snapshot > 0),
  reference text,
  bank text,
  received_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check ((currency = 'BS' and exchange_rate_snapshot is null) or (currency = 'USD' and exchange_rate_snapshot is not null)),
  check ((method in ('PAGO_MOVIL', 'PUNTO_VENTA', 'TRANSFERENCIA') and reference is not null) or method not in ('PAGO_MOVIL', 'PUNTO_VENTA', 'TRANSFERENCIA'))
);

create table public.credit_note_payments (
  id uuid primary key default gen_random_uuid(),
  credit_note_id uuid not null references public.credit_notes(id) on delete cascade,
  shift_id uuid not null references public.cashier_shifts(id),
  amount numeric(18, 2) not null check (amount > 0),
  currency public.currency_code not null,
  amount_bs numeric(18, 2) not null check (amount_bs > 0),
  exchange_rate_snapshot numeric(18, 6) check (exchange_rate_snapshot is null or exchange_rate_snapshot > 0),
  method public.payment_method_code not null,
  reference text,
  bank text,
  received_at timestamptz not null default now(),
  cashier_id uuid not null references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  check ((currency = 'BS' and exchange_rate_snapshot is null) or (currency = 'USD' and exchange_rate_snapshot is not null))
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  movement_type public.inventory_movement_type not null,
  quantity numeric(12, 3) not null check (quantity <> 0),
  unit_cost_bs numeric(18, 2) check (unit_cost_bs is null or unit_cost_bs >= 0),
  reason text,
  reference_type text,
  reference_id uuid,
  occurred_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.partial_closures (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.cashier_shifts(id) on delete cascade,
  name text not null,
  cash_bs numeric(18, 2) not null default 0 check (cash_bs >= 0),
  cash_usd numeric(18, 2) not null default 0 check (cash_usd >= 0),
  point_of_sale_bs numeric(18, 2) not null default 0 check (point_of_sale_bs >= 0),
  payment_mobile_bs numeric(18, 2) not null default 0 check (payment_mobile_bs >= 0),
  credit_payments_bs numeric(18, 2) not null default 0 check (credit_payments_bs >= 0),
  total_bs numeric(18, 2) not null default 0 check (total_bs >= 0),
  occurred_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.shift_distributions (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.cashier_shifts(id) on delete cascade,
  recipient_user_id uuid references public.profiles(id),
  recipient_name text,
  amount_bs numeric(18, 2) not null check (amount_bs > 0),
  notes text,
  created_at timestamptz not null default now(),
  check (recipient_user_id is not null or nullif(trim(recipient_name), '') is not null)
);

create index inventory_movements_product_time on public.inventory_movements (product_id, occurred_at desc);
create index sales_shift_time on public.sales (shift_id, created_at desc);
create index sales_cashier_time on public.sales (cashier_id, created_at desc);
create index sale_payments_sale on public.sale_payments (sale_id);
create index credit_note_payments_note on public.credit_note_payments (credit_note_id);

create view public.product_stock as
select
  p.id as product_id,
  coalesce(sum(im.quantity), 0)::numeric(12, 3) as current_quantity
from public.products p
left join public.inventory_movements im on im.product_id = p.id
group by p.id;

create view public.credit_note_balances as
select
  cn.id as credit_note_id,
  cn.code,
  cn.customer_id,
  cn.issued_at,
  coalesce(charges.charged_bs, 0)::numeric(18, 2) as charged_bs,
  coalesce(payments.paid_bs, 0)::numeric(18, 2) as paid_bs,
  greatest(coalesce(charges.charged_bs, 0) - coalesce(payments.paid_bs, 0), 0)::numeric(18, 2) as balance_bs
from public.credit_notes cn
left join (
  select credit_note_id, sum(total_bs) as charged_bs
  from public.sales
  where status = 'completed'
  group by credit_note_id
) charges on charges.credit_note_id = cn.id
left join (
  select credit_note_id, sum(amount_bs) as paid_bs
  from public.credit_note_payments
  group by credit_note_id
) payments on payments.credit_note_id = cn.id;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'dueno' and active
  );
$$;

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_price_history enable row level security;
alter table public.product_cost_history enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.cashier_shifts enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.credit_notes enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_payments enable row level security;
alter table public.credit_note_payments enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.partial_closures enable row level security;
alter table public.shift_distributions enable row level security;

create policy profiles_read_authenticated on public.profiles for select to authenticated using (active or id = auth.uid() or public.is_owner());
create policy settings_read_authenticated on public.app_settings for select to authenticated using (true);
create policy settings_owner_write on public.app_settings for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy catalog_read_authenticated on public.categories for select to authenticated using (true);
create policy products_read_authenticated on public.products for select to authenticated using (active or public.is_owner());
create policy products_owner_write on public.products for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy prices_read_authenticated on public.product_price_history for select to authenticated using (true);
create policy costs_owner_read on public.product_cost_history for select to authenticated using (public.is_owner());
create policy rates_read_authenticated on public.exchange_rates for select to authenticated using (true);
create policy rates_owner_write on public.exchange_rates for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy shifts_read_authenticated on public.cashier_shifts for select to authenticated using (cashier_id = auth.uid() or public.is_owner());
create policy customers_read_authenticated on public.customers for select to authenticated using (true);
create policy sales_read_authenticated on public.sales for select to authenticated using (cashier_id = auth.uid() or public.is_owner());
create policy sale_items_read_authenticated on public.sale_items for select to authenticated using (exists (select 1 from public.sales s where s.id = sale_id and (s.cashier_id = auth.uid() or public.is_owner())));
create policy credit_notes_read_authenticated on public.credit_notes for select to authenticated using (issued_by = auth.uid() or public.is_owner());
create policy credit_balances_read_authenticated on public.credit_note_payments for select to authenticated using (cashier_id = auth.uid() or public.is_owner());
create policy inventory_read_authenticated on public.inventory_movements for select to authenticated using (public.is_owner() or exists (select 1 from public.products p where p.id = product_id and p.active));
create policy partial_closures_read_authenticated on public.partial_closures for select to authenticated using (created_by = auth.uid() or public.is_owner());
create policy distributions_read_authenticated on public.shift_distributions for select to authenticated using (public.is_owner());

comment on table public.sales is 'Ventas creadas por una funcion transaccional; el cliente no debe insertar ventas directamente.';
comment on table public.inventory_movements is 'Libro mayor de stock. Quantity positiva agrega stock y negativa lo descuenta.';
comment on view public.credit_note_balances is 'Saldo derivado: cargos de ventas menos pagos convertidos a Bs.';
