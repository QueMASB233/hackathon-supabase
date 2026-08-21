# API

Contrato real implementado por `backend/` (Hono). Compatible con [`frontend/src/api/adapters/http/index.ts`](../frontend/src/api/adapters/http/index.ts).

Auth passwordless. No hay endpoints de password. El rol **nunca** viaja en el body.

Errores (raíz, no anidados — el PWA lee `body.code`):

```json
{ "code": "FORBIDDEN", "message": "No tienes acceso a este recurso.", "requestId": "…" }
```

Códigos: `UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | VALIDATION | RATE_LIMITED | SERVER | AI_BLOCKED | OUT_OF_SCOPE | PROMPT_BLOCKED | INVITE_PENDING | CODE_INVALID | CODE_EXPIRED`.

## Auth

- `POST /api/auth/request-code` `{ email }` → `{ email }`
- `POST /api/auth/resend-code` `{ email }` → `{ email, retryAfterSec }`
- `POST /api/auth/verify` `{ email, code }` → `{ token }` (JWT de Supabase)
- `POST /api/auth/logout` → 204
- `GET /api/invites/:token` → preview (lookup por hash; sin sesión)
- `POST /api/invites/:token/accept` `{ email }` → `{ email }`

`request-code` solo para emails en `profiles` o invitaciones `accepted`. Invitación `pending` → `INVITE_PENDING`.

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
