# Backend

API HTTP de SecureWorkspace. El frontend nunca habla con Postgres ni Storage.

## Correr

```bash
cd backend
cp .env.example .env   # rellenar secretos locales; no commitear
npm install
npm run dev            # http://localhost:8000
```

Migraciones (Supabase CLI o SQL editor, en orden):

`supabase/migrations/001_*.sql` … `011_*.sql`

```bash
npm run seed
```

Frontend en modo real:

`frontend/.env` → `VITE_API_MODE=http` y `VITE_API_BASE_URL=http://localhost:8000`

Magic link: `APP_URL` (default `CORS_ORIGIN`) define el `emailRedirectTo`. Esa URL + `/auth/callback` debe estar en Supabase > Auth > URL Configuration > Redirect URLs.

## Secretos

Solo en `backend/.env`:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

Nunca en frontend, git, logs ni README.

## Roles de cliente Supabase

- JWT del usuario + anon: lecturas/escrituras de tenant (RLS).
- service_role: admin, seed, auditoría, preview de invitaciones por hash, validación del JWT del magic link.

## Health

`GET /health`
