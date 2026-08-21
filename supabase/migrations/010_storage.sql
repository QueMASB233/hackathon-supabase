insert into storage.buckets (id, name, public)
values ('workspace-documents', 'workspace-documents', false)
on conflict (id) do update set public = false;

create policy storage_select_member on storage.objects
  for select using (
    bucket_id = 'workspace-documents'
    and public.is_workspace_member(((storage.foldername(name))[2])::uuid)
  );

create policy storage_insert_business on storage.objects
  for insert with check (
    bucket_id = 'workspace-documents'
    and public.workspace_member_role(((storage.foldername(name))[2])::uuid) = 'business'
  );

create policy storage_update_business on storage.objects
  for update using (
    bucket_id = 'workspace-documents'
    and public.workspace_member_role(((storage.foldername(name))[2])::uuid) = 'business'
  );

create policy storage_delete_business on storage.objects
  for delete using (
    bucket_id = 'workspace-documents'
    and public.workspace_member_role(((storage.foldername(name))[2])::uuid) = 'business'
  );
