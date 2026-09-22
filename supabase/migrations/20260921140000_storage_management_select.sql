-- Supabase Storage metadata read access for the management workflow.
--
-- Uploads use Storage's insert path, which returns the created object metadata.
-- Supabase can therefore evaluate SELECT RLS while completing an upload.
-- Keep this policy scoped to the same management role and bucket as the
-- existing insert/update/delete policies.

-- Make the migration safe to retry after a partially-applied local migration.
drop policy if exists storefront_media_management_select on storage.objects;

create policy storefront_media_management_select
on storage.objects
for select to authenticated
using (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);
