# Supabase

Proyecto: `https://rdvmkdsthquvddgmzlqj.supabase.co`

Todo SQL está en `migrations/`, aplicado en orden:

1. `001_extensions.sql` — pgcrypto, vector
2. `002_tenancy.sql` — profiles, businesses, clients
3. `003_workspaces.sql` — workspaces, workspace_members
4. `004_invitations.sql`
5. `005_documents.sql` — documents, document_chunks (pgvector)
6. `006_conversations.sql`
7. `007_audit.sql`
8. `008_functions.sql` — helpers RLS + `match_document_chunks(workspace_id, query)`
9. `009_rls.sql`
10. `010_storage.sql` — bucket privado `workspace-documents`
11. `011_grants.sql`

RLS está activado en todas las tablas sensibles. El frontend no aplica políticas.

Auth: habilitar **Email** (passwordless, magic link) en el dashboard. No hay passwords en el producto. En Auth > URL Configuration agregar `{APP_URL}/auth/callback` a Redirect URLs (local: `http://localhost:5173/auth/callback`).

Storage: bucket `workspace-documents`, `public = false`. Path: `workspaces/{workspace_id}/documents/{document_id}/file`.
