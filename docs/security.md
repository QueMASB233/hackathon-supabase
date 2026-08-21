# Seguridad

La autoridad no está en el frontend.

## Capas (cuando exista backend)

Auth → autenticación de API → autorización → reglas de negocio → RLS → Storage policies → rate limiting → audit.

Nunca confiar en botones ocultos, rutas “protegidas” solo en React, IDs, localStorage o condiciones JS.

## Frontend P0

- Sin `service_role`, sin password de DB, sin `OPENAI_API_KEY`.
- Sesión en `sessionStorage` bajo clave opaca. No se loguea el token.
- `GET /api/me` y capabilities mandan la UI. Un ID manipulado debe fallar en API (el mock responde 403 si José abre el workspace de María).
- Rate limit: el UI muestra 429. No implementa el límite.

## Demo

Business Mathias abre José. Client José abre `/app/workspaces/ws-maria` → `FORBIDDEN`.

## Auth

Passwordless. El código 2FA lo valida el backend. El mock acepta `123456` solo para desarrollar UI.
