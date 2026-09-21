-- Supabase Storage access for storefront media.
-- The bucket definitions live in supabase/config.toml.

create policy storefront_media_management_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);

create policy storefront_media_management_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
)
with check (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);

create policy storefront_media_management_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);
