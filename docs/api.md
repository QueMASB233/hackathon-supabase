# API

Contrato conceptual. El backend P0 **no está implementado**. El frontend se adapta al contrato real cuando exista.

Auth es passwordless. No hay endpoints de password.

## Auth

- `POST /api/auth/request-code` `{ email }`
- `POST /api/auth/resend-code` `{ email }` → `{ retryAfterSec }`
- `POST /api/auth/verify` `{ email, code }` → `{ token }`
- `POST /api/auth/logout`
- `GET /api/invites/:token`
- `POST /api/invites/:token/accept` `{ email }`

## Sesión y yo

- `GET /api/me` → `{ id, email, displayName, organizationName, homePath, permissions[] }`

`homePath` lo decide el backend. El frontend redirige ahí.

## Clientes / workspaces

- `GET /api/clients`
- `POST /api/clients` (multipart: name, description, emails, icon)
- `GET /api/workspaces/:id` → workspace + `capabilities` + `nav` + `suggestedQuestions`

## Documentos

- `GET /api/workspaces/:id/documents`
- `POST /api/workspaces/:id/documents`
- `DELETE /api/documents/:id`
- `GET /api/documents/:id/download`

Estados de documento: `uploading | processing | chunking | indexing | ready | failed`. El frontend no calcula el pipeline.

## Chat

- `GET /api/workspaces/:id/conversations`
- `POST /api/workspaces/:id/conversations`
- `PATCH /api/conversations/:id`
- `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/messages`
- `POST /api/ai/query` (stream de chunks: token / sources / done)

## Auditoría

- `GET /api/workspaces/:id/audit`

## Errores

El cuerpo puede incluir `code`:

`UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | VALIDATION | RATE_LIMITED | SERVER | AI_BLOCKED | OUT_OF_SCOPE | PROMPT_BLOCKED | INVITE_PENDING | CODE_INVALID | CODE_EXPIRED`

El cliente HTTP está en `frontend/src/api/adapters/http`.
