# SecureWorkspace

PWA B2B para workspaces privados de conocimiento. La experiencia principal no es un Drive: es **preguntarle al workspace**.

## Arquitectura

```
Frontend PWA (dumb)
        │ API
        ▼
Backend (lógica, auth, guardrails, rate limit)
        │
        ├── Supabase (Postgres + RLS, Auth, Storage)
        ├── OpenAI
        └── NeMo Guardrails
```

El frontend **no** habla con la base de datos, **no** contiene secretos y **no** decide permisos. Renderiza lo que el API autoriza.

En P0 el backend no existe. El cliente corre contra adapters mock (`VITE_API_MODE=mock`).

## Cómo correr el frontend

```bash
cd frontend
cp .env.example .env   # ya viene en mock
npm install
npm run dev
```

Demo passwordless:

1. Correo `mathias@mathias.sa` → código `123456` → dashboard business.
2. Correo `jose@email.com` → código `123456` → workspace José S.A.
3. Invitación: `/invite/invite-jose-contacto` (correo `contacto@jose.com`) → mismo código.
4. Código `000000` = inválido. `999999` = expirado.
5. Un client que abra `/app/workspaces/ws-maria` recibe 403.

No hay contraseñas.

## Estructura

```
frontend/     PWA (este entregable)
backend/      stub — API futura
supabase/     migrations y functions (vacío en P0)
docs/         arquitectura, API, seguridad, RAG, changelog
```

## Variables públicas

Solo en frontend, y solo públicas:

- `VITE_API_MODE=mock|http`
- `VITE_API_BASE_URL` (cuando haya backend)
- `VITE_SUPABASE_URL` queda comentada; no se usa en P0

Nunca: `service_role`, database password, `OPENAI_API_KEY`.
