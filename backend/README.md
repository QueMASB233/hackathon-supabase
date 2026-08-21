# Backend

API HTTP de SecureWorkspace. El frontend nunca habla con Postgres ni Storage.

## Correr

```bash
cd backend
cp .env.example .env   # rellenar secretos locales; no commitear
npm install
npm run dev            # http://localhost:8000
```

Sidecar NeMo (otro terminal):

```bash
cd backend/guardrails
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --port 8001
```

Migraciones (Supabase CLI o SQL editor, en orden):

`supabase/migrations/001_*.sql` … `011_*.sql`

```bash
npm run seed
```

Frontend en modo real:

`frontend/.env` → `VITE_API_MODE=http` y `VITE_API_BASE_URL=http://localhost:8000`

## Secretos

Solo en `backend/.env`:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

Nunca en frontend, git, logs ni README.

## Roles de cliente Supabase

- JWT del usuario + anon: lecturas/escrituras de tenant (RLS).
- service_role: OTP/admin, seed, auditoría, preview de invitaciones por hash.

## Health

`GET /health`
