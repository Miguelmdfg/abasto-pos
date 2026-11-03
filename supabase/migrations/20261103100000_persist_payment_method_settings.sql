alter table public.app_settings
  add column enabled_payment_methods jsonb not null
  default '{
    "efectivo_bs": true,
    "efectivo_usd": true,
    "pagomovil": true,
    "punto_venta": true,
    "mixto": true,
    "fiado": true
  }'::jsonb;

alter table public.app_settings
  add constraint app_settings_enabled_payment_methods_object
  check (
    jsonb_typeof(enabled_payment_methods) = 'object'
    and enabled_payment_methods ?& array[
      'efectivo_bs',
      'efectivo_usd',
      'pagomovil',
      'punto_venta',
      'mixto',
      'fiado'
    ]
    and jsonb_typeof(enabled_payment_methods -> 'efectivo_bs') = 'boolean'
    and jsonb_typeof(enabled_payment_methods -> 'efectivo_usd') = 'boolean'
    and jsonb_typeof(enabled_payment_methods -> 'pagomovil') = 'boolean'
    and jsonb_typeof(enabled_payment_methods -> 'punto_venta') = 'boolean'
    and jsonb_typeof(enabled_payment_methods -> 'mixto') = 'boolean'
    and jsonb_typeof(enabled_payment_methods -> 'fiado') = 'boolean'
  );
