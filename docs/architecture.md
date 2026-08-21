# Arquitectura

```
Frontend PWA (dumb)
        │ Bearer JWT
        ▼
Hono API :8000
        │
        ├── user client (anon + JWT) → RLS / Storage
        ├── admin client (service_role) → invite hash, seed, audit
        ├── OpenAI (embeddings + chat)
        └── Postgres + pgvector
```

El frontend no usa `supabase-js`. `VITE_API_MODE=http` activa [`frontend/src/api/adapters/http`](../frontend/src/api/adapters/http/index.ts).

Permisos: el API los emite; ocultar un botón no autoriza.
