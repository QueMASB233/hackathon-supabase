create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.workspace_member_role(p_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.workspace_members m
  where m.workspace_id = p_workspace_id
    and m.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_business_owner(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.owner_id = auth.uid()
  );
$$;

create or replace function public.owns_any_business()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.businesses b where b.owner_id = auth.uid()
  );
$$;

-- Retrieval is always scoped by workspace_id in the same statement.
create or replace function public.match_document_chunks(
  p_workspace_id uuid,
  p_query vector(1536),
  p_limit integer default 8
)
returns table (
  id uuid,
  workspace_id uuid,
  document_id uuid,
  chunk_index integer,
  content text,
  page integer,
  filename text,
  similarity float
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    c.workspace_id,
    c.document_id,
    c.chunk_index,
    c.content,
    c.page,
    c.filename,
    1 - (c.embedding <=> p_query) as similarity
  from public.document_chunks c
  where c.workspace_id = p_workspace_id
    and c.embedding is not null
  order by c.embedding <=> p_query
  limit greatest(1, least(p_limit, 20));
$$;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.workspace_member_role(uuid) to authenticated;
grant execute on function public.is_business_owner(uuid) to authenticated;
grant execute on function public.owns_any_business() to authenticated;
grant execute on function public.match_document_chunks(uuid, vector, integer) to authenticated;
