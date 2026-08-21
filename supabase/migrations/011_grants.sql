grant usage on schema public to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, update on public.businesses to authenticated;
grant select, insert, update on public.clients to authenticated;
grant select, insert, update on public.workspaces to authenticated;
grant select, insert on public.workspace_members to authenticated;
grant select, insert, update on public.invitations to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, delete on public.document_chunks to authenticated;
grant select, insert, update on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert on public.message_sources to authenticated;
grant select on public.audit_logs to authenticated;

grant usage, select on all sequences in schema public to authenticated;
