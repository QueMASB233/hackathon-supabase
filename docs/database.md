# Base de datos

P0 no incluye schema. No hay SQL fuera de `supabase/migrations/`.

Cuando se implemente, versionar por ejemplo:

1. `001_initial_schema.sql`
2. `002_profiles.sql`
3. `003_workspaces.sql`
4. `004_memberships.sql`
5. `005_documents.sql`
6. `006_conversations.sql`
7. `007_audit_logs.sql`
8. `008_rls.sql`

RLS siempre. Client A ve workspace A, no B. Documentos igual. Business según ownership y permisos del backend.

Actualizar este archivo y `docs/changelog.md` en cada migration.
