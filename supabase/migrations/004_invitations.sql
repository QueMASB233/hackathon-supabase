create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  email text not null,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  invited_by uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  attempt_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists invitations_email_idx on public.invitations (email);
create index if not exists invitations_workspace_id_idx on public.invitations (workspace_id);
