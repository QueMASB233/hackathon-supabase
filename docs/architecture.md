# Arquitectura

SecureWorkspace separa representación (PWA) de autoridad (backend + Postgres RLS).

```
                         ┌─────────────────┐
                         │    FRONTEND     │
                         │   PWA / DUMB    │
                         └────────┬────────┘
                                  │ API
                                  ▼
                         ┌─────────────────┐
                         │     BACKEND     │
                         │ Business Logic  │
                         │ Auth / Guards   │
                         │ Rate Limiting   │
                         └────────┬────────┘
                    ┌─────────────┼──────────────┐
                    ▼             ▼              ▼
                Supabase       OpenAI       NeMo Guardrails
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       Postgres   Storage    Auth
          │
         RLS
          │
       Audit
```

## Capas del frontend

1. Páginas y componentes: render, loading, empty, error, motion.
2. `src/api/*`: único acceso de red. Los componentes no hacen `fetch`.
3. `src/api/adapters/mock`: datos de desarrollo. No es lógica de negocio de producto.
4. `src/api/adapters/http`: cliente listo para el backend real (`VITE_API_MODE=http`).
5. TanStack Query: estado de servidor.
6. Zustand: estado de UI (sidebar, composer, boot, toasts).

## Auth

Passwordless: correo → código 2FA de 6 dígitos → sesión opaca en `sessionStorage`. El token no se imprime ni va en la URL.

## Permisos

El API entrega `permissions` y `workspace.capabilities`. La UI oculta controles si el flag no viene. Eso no autoriza: un 403 revierte el estado optimista.

## P0 vs siguiente

P0: frontend + mocks + docs + stubs de `backend/` y `supabase/`.

Siguiente: API real, migrations, RLS, RAG, OpenAI, NeMo. El frontend no cambia de forma: cambia `VITE_API_MODE`.
