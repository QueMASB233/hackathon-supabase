# API

Contrato real implementado por `backend/` (Hono). Compatible con [`frontend/src/api/adapters/http/index.ts`](../frontend/src/api/adapters/http/index.ts).

Auth passwordless. No hay endpoints de password. El rol **nunca** viaja en el body.

Errores (raíz, no anidados — el PWA lee `body.code`):

```json
{ "code": "FORBIDDEN", "message": "No tienes acceso a este recurso.", "requestId": "…" }
```

Códigos: `UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | VALIDATION | RATE_LIMITED | SERVER | AI_BLOCKED | OUT_OF_SCOPE | PROMPT_BLOCKED | INVITE_PENDING | CODE_INVALID | CODE_EXPIRED`.

## Auth

Empresas con contraseña; clientes invitados con magic link.

- `POST /api/auth/login` `{ email, password }` → `{ token }`
- `POST /api/auth/signup-business` `{ email, password, organizationName }` → `{ token }`
- `POST /api/auth/request-link` `{ email }` → `{ email }` (cliente invitado)
- `POST /api/auth/resend-link` `{ email }` → `{ email, retryAfterSec }`
- `POST /api/auth/session` `{ token }` → `{ token }` (JWT del magic link, ya verificado)
- `POST /api/auth/logout` → 204
- `GET /api/invites/:token` → preview (lookup por hash; sin sesión)
- `POST /api/invites/:token/accept` `{ email }` → `{ email }`

`signup-business` crea el usuario con `email_confirm: true` y devuelve sesión de inmediato, así el registro no depende del envío de correo. Contraseña mínima de 8 caracteres. Rechaza si el correo ya tiene profile (`CONFLICT`) o invitación pendiente (`INVITE_PENDING`). Credenciales inválidas en `login` → `401 UNAUTHORIZED`.

Magic link: el backend lo pide a Supabase con `emailRedirectTo = {APP_URL}/auth/callback`. Supabase verifica el enlace y devuelve el `access_token` en el fragmento de la URL. El PWA lo envía a `POST /api/auth/session`, que revalida el JWT con `auth.getUser` y recién ahí aprovisiona `profiles` y membresías. Enlace inválido o ya usado → `CODE_INVALID`; vencido → `CODE_EXPIRED`.

`request-link` solo para invitaciones `accepted` o perfiles de cliente. Invitación `pending` → `INVITE_PENDING`. Una cuenta de empresa recibe `422` pidiéndole que use su contraseña.

## Salud

- `GET /health` → `{ ok: true }`
- `GET /health/deps` → `{ ok, database, openai: { configured, ok, reason? } }`; `503` si algo falla

## Sesión

- `GET /api/me` → `{ id, email, displayName, organizationName, homePath, permissions[] }`

`homePath` y `permissions` los calcula el backend.

## Clientes / workspaces

- `GET /api/clients` (business)
- `POST /api/clients` multipart: `name`, `description`, `emails` JSON, `icon` opcional. Extra: `invites[{ email, url }]` (el PWA lo ignora).
- `GET /api/workspaces/:id` → `capabilities`, `nav`, `suggestedQuestions`

## Documentos

- `GET /api/workspaces/:id/documents`
- `POST /api/workspaces/:id/documents` (file)
- `DELETE /api/documents/:id`
- `GET /api/documents/:id/download` header `X-Filename`

Estados: `uploading | processing | chunking | indexing | ready | failed`.

## Chat

- `GET|POST /api/workspaces/:id/conversations`
- `PATCH /api/conversations/:id` `{ title }`
- `GET|POST /api/conversations/:id/messages`
- `POST /api/ai/query` `{ workspaceId, conversationId, content }` NDJSON: `token | sources | done`

## Auditoría

- `GET /api/workspaces/:id/audit` (requiere `audit.view`)
