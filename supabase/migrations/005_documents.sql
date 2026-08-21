create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  uploaded_by uuid references public.profiles (id) on delete set null,
  name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  storage_path text not null,
  status text not null default 'processing'
    check (status in ('uploading', 'processing', 'chunking', 'indexing', 'ready', 'failed')),
  status_label text not null default 'Procesando',
  created_at timestamptz not null default now()
);

create index if not exists documents_workspace_id_idx on public.documents (workspace_id);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  page integer,
  filename text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_workspace_id_idx on public.document_chunks (workspace_id);
create index if not exists document_chunks_document_id_idx on public.document_chunks (document_id);
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);
