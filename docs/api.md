# API

Contrato real implementado por `backend/` (Hono). Compatible con [`frontend/src/api/adapters/http/index.ts`](../frontend/src/api/adapters/http/index.ts).

Auth passwordless. No hay endpoints de password. El rol **nunca** viaja en el body.

Errores (raíz, no anidados — el PWA lee `body.code`):

```json
{ "code": "FORBIDDEN", "message": "No tienes acceso a este recurso.", "requestId": "…" }
```

Códigos: `UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | VALIDATION | RATE_LIMITED | SERVER | AI_BLOCKED | OUT_OF_SCOPE | PROMPT_BLOCKED | INVITE_PENDING | CODE_INVALID | CODE_EXPIRED`.

## Auth

Passwordless por **magic link**. No hay códigos ni contraseñas.

- `POST /api/auth/request-link` `{ email }` → `{ email }` (cuentas existentes)
- `POST /api/auth/signup-business` `{ email, organizationName }` → `{ email }` (agencia nueva)
- `POST /api/auth/resend-link` `{ email }` → `{ email, retryAfterSec }`
- `POST /api/auth/session` `{ token }` → `{ token }` (JWT de Supabase, ya verificado)
- `POST /api/auth/logout` → 204
- `GET /api/invites/:token` → preview (lookup por hash; sin sesión)
- `POST /api/invites/:token/accept` `{ email }` → `{ email }`

Flujo: el backend pide el enlace a Supabase con `emailRedirectTo = {APP_URL}/auth/callback`. Supabase verifica el enlace y devuelve el `access_token` en el fragmento de la URL. El PWA lo envía a `POST /api/auth/session`, que revalida el JWT con `auth.getUser` y recién ahí aprovisiona `profiles`, membresías y `businesses`.

`request-link` solo para emails en `profiles` o invitaciones `accepted`. Invitación `pending` → `INVITE_PENDING`.

`signup-business` rechaza si el correo ya tiene profile (`CONFLICT`) o invitación pendiente. El `organizationName` viaja como `user_metadata.organization_name` de Supabase, así el registro sobrevive si el usuario abre el enlace en otro dispositivo. El rol nunca viaja en el body: lo deriva el backend en `session`.

Enlace inválido o ya usado → `CODE_INVALID`; enlace vencido → `CODE_EXPIRED`.

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
