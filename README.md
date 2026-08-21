# SecureWorkspace

PWA B2B de conocimiento seguro. El frontend es dumb; la autoridad es el backend + RLS.

## Arquitectura

```
Frontend PWA
    → HTTP API (Hono :8000)
        → Supabase (Auth, Postgres+RLS, Storage)
        → OpenAI
```

## Frontend (mock o API real)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

`VITE_API_MODE=mock` (default) o `http` contra `VITE_API_BASE_URL=http://localhost:8000`.

## Backend

Ver [`backend/README.md`](backend/README.md). Secretos solo en `backend/.env`.

## Demo passwordless

El login es correo + magic link (Supabase Auth). No hay contraseñas ni códigos. El enlace vuelve a `{APP_URL}/auth/callback`, que debe estar en Supabase > Auth > URL Configuration > Redirect URLs.

Tras `npm run seed` en backend: `mathias@mathias.sa` (business) y `jose@email.com` (client). José no puede abrir el workspace de María (`403` + RLS).

## Secretos

Nunca: `service_role`, database password, `OPENAI_API_KEY` en frontend, git o docs con valores reales.
