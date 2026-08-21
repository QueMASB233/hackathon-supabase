create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  title text not null default 'Nueva conversación',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_workspace_id_idx on public.conversations (workspace_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  status text not null default 'sent' check (status in ('sending', 'sent', 'failed', 'streaming')),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_workspace_id_idx on public.messages (workspace_id);

create table if not exists public.message_sources (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  chunk_id uuid references public.document_chunks (id) on delete set null,
  locator text not null
);

create index if not exists message_sources_message_id_idx on public.message_sources (message_id);
