begin;

select plan(9);

select is(
  (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'management_memberships',
        'customers',
        'categories',
        'products',
        'product_images',
        'home_sections',
        'home_sections_products',
        'category_promotions',
        'customer_tier_rules',
        'customer_addresses',
        'orders',
        'order_items',
        'return_requests',
        'delivery_shipments',
        'wishlists'
      )
      and c.relrowsecurity
  ),
  15::bigint,
  'All application tables have RLS enabled'
);

select ok(
  not has_table_privilege('anon', 'public.products', 'INSERT')
  and not has_table_privilege('anon', 'public.products', 'UPDATE')
  and not has_table_privilege('anon', 'public.products', 'DELETE'),
  'Anonymous users cannot write to products'
);

select ok(
  not has_table_privilege('authenticated', 'public.orders', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.return_requests', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.delivery_shipments', 'UPDATE'),
  'Authenticated clients cannot directly mutate financial/courier state'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_order_atomic(text,text,text,text,text,text,text,numeric,numeric,text,text,jsonb)',
    'EXECUTE'
  )
  and has_function_privilege(
    'authenticated',
    'public.create_order_atomic(text,text,text,text,text,text,text,numeric,numeric,text,text,jsonb)',
    'EXECUTE'
  ),
  'Order creation RPC is callable only by authenticated users'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_customer_return_request(uuid,text,text,text,jsonb,text)',
    'EXECUTE'
  )
  and has_function_privilege(
    'authenticated',
    'public.create_customer_return_request(uuid,text,text,text,jsonb,text)',
    'EXECUTE'
  ),
  'Customer return RPC is callable only by authenticated users'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
      and policyname = 'orders_read_own_or_management'
  )
  and exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'return_requests'
      and policyname = 'returns_read_own_or_management'
  ),
  'Customer order and return read policies exist'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'products_management_update'
  )
  and exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'categories_management_update'
  ),
  'Management catalog update policies exist'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'has_management_role'
      and p.prosecdef
  )
  and exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'is_owner'
      and p.prosecdef
  ),
  'Management helper functions use SECURITY DEFINER'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'create_order_atomic'
      and p.proconfig @> array['search_path=']
  )
  and exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'update_return_request'
      and p.proconfig @> array['search_path=']
  ),
  'Security-definer business functions pin an empty search_path'
);

select * from finish();

rollback;
