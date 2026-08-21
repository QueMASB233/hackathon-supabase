# Base de datos

SQL versionado en `supabase/migrations/` (001–011). No hay SQL ad-hoc de producción.

## Tablas

- `profiles` (id = `auth.users.id`)
- `businesses` (`owner_id` unique)
- `clients` (`business_id`)
- `workspaces` (`business_id`, `client_id` unique)
- `workspace_members` (`role` in `business|client`)
- `invitations` (`token_hash`, nunca el token en claro)
- `documents` (`workspace_id`, status de pipeline)
- `document_chunks` (`workspace_id` NOT NULL, `embedding vector(1536)`)
- `conversations`, `messages` (`workspace_id`), `message_sources`
- `audit_logs`

## Retrieval

`match_document_chunks(p_workspace_id, p_query, p_limit)` filtra **siempre** por `workspace_id` en el mismo `SELECT`. No hay búsqueda vectorial global.

## RLS

Activado en todas las tablas de tenant. Lecturas de membresía vía helpers `security definer` para evitar recursión. Client José no ve filas del workspace María.

El backend usa el JWT del usuario (anon) para operaciones de tenant. `service_role` solo admin/seed/audit/invite preview.
