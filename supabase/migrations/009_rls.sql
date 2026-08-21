alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.clients enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invitations enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_sources enable row level security;
alter table public.audit_logs enable row level security;

-- profiles
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid());

create policy profiles_select_workspace_peers on public.profiles
  for select using (
    exists (
      select 1
      from public.workspace_members mine
      join public.workspace_members theirs
        on theirs.workspace_id = mine.workspace_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );

create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- businesses
create policy businesses_select on public.businesses
  for select using (
    owner_id = auth.uid()
    or exists (
      select 1
      from public.workspaces w
      where w.business_id = businesses.id
        and public.is_workspace_member(w.id)
    )
  );

create policy businesses_update_owner on public.businesses
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- clients
create policy clients_select on public.clients
  for select using (
    public.is_business_owner(business_id)
    or exists (
      select 1 from public.workspaces w
      where w.client_id = clients.id
        and public.is_workspace_member(w.id)
    )
  );

create policy clients_insert_owner on public.clients
  for insert with check (public.is_business_owner(business_id));

create policy clients_update_owner on public.clients
  for update using (public.is_business_owner(business_id));

-- workspaces
create policy workspaces_select on public.workspaces
  for select using (public.is_workspace_member(id) or public.is_business_owner(business_id));

create policy workspaces_insert_owner on public.workspaces
  for insert with check (public.is_business_owner(business_id));

create policy workspaces_update_owner on public.workspaces
  for update using (public.is_business_owner(business_id));

-- memberships
create policy members_select on public.workspace_members
  for select using (
    user_id = auth.uid()
    or public.is_workspace_member(workspace_id)
    or exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id
        and public.is_business_owner(w.business_id)
    )
  );

create policy members_insert_owner on public.workspace_members
  for insert with check (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id
        and public.is_business_owner(w.business_id)
    )
  );

-- invitations
create policy invitations_select on public.invitations
  for select using (
    public.is_business_owner((select w.business_id from public.workspaces w where w.id = workspace_id))
  );

create policy invitations_insert on public.invitations
  for insert with check (
    invited_by = auth.uid()
    and public.is_business_owner((select w.business_id from public.workspaces w where w.id = workspace_id))
  );

create policy invitations_update on public.invitations
  for update using (
    public.is_business_owner((select w.business_id from public.workspaces w where w.id = workspace_id))
  );

-- documents
create policy documents_select on public.documents
  for select using (public.is_workspace_member(workspace_id));

create policy documents_insert_business on public.documents
  for insert with check (public.workspace_member_role(workspace_id) = 'business');

create policy documents_update_business on public.documents
  for update using (public.workspace_member_role(workspace_id) = 'business');

create policy documents_delete_business on public.documents
  for delete using (public.workspace_member_role(workspace_id) = 'business');

-- chunks
create policy chunks_select on public.document_chunks
  for select using (public.is_workspace_member(workspace_id));

create policy chunks_insert_business on public.document_chunks
  for insert with check (public.workspace_member_role(workspace_id) = 'business');

create policy chunks_delete_business on public.document_chunks
  for delete using (public.workspace_member_role(workspace_id) = 'business');

-- conversations
create policy conversations_select on public.conversations
  for select using (public.is_workspace_member(workspace_id));

create policy conversations_insert_member on public.conversations
  for insert with check (public.is_workspace_member(workspace_id));

create policy conversations_update_member on public.conversations
  for update using (public.is_workspace_member(workspace_id));

-- messages
create policy messages_select on public.messages
  for select using (public.is_workspace_member(workspace_id));

create policy messages_insert_member on public.messages
  for insert with check (public.is_workspace_member(workspace_id));

-- message sources
create policy message_sources_select on public.message_sources
  for select using (
    exists (
      select 1 from public.messages m
      where m.id = message_sources.message_id
        and public.is_workspace_member(m.workspace_id)
    )
  );

create policy message_sources_insert on public.message_sources
  for insert with check (
    exists (
      select 1 from public.messages m
      where m.id = message_id
        and public.is_workspace_member(m.workspace_id)
    )
  );

-- audit: members with business role can read; inserts via service role
create policy audit_select_business on public.audit_logs
  for select using (
    workspace_id is not null
    and public.workspace_member_role(workspace_id) = 'business'
  );
