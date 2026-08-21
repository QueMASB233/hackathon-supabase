# Seguridad

Autoridad: Auth JWT → autorización en API → RLS → Storage policies → rate limit → audit → guardrails.

El frontend no es la seguridad.

## Auth

Passwordless: Supabase Email OTP. El backend valida el JWT con `auth.getUser`. El body no puede enviar `role`.

## Autorización

`workspace_members.role` + `permissionsFor`. Client: ver/descargar/chat/IA. Business: clientes, upload, delete, audit.

GET workspace ajeno → `403 FORBIDDEN` y evento `ACCESS_DENIED`. RLS devolvería cero filas aunque se omitiera el check.

## Storage

Bucket privado `workspace-documents`. Business: insert/update/delete. Member: select/download. Client no sube ni borra.

## Rate limit

In-memory por IP+ruta en: request-code, resend, verify, accept invite, upload, AI. `429 RATE_LIMITED`.

## Audit

Eventos: LOGIN, INVITATION_*, CLIENT_CREATED, WORKSPACE_CREATED, DOCUMENT_*, CONVERSATION_CREATED, AI_QUERY, AI_RESPONSE, ACCESS_DENIED, RATE_LIMITED (vía warn), GUARDRAIL_BLOCKED (cuando el rail deniega). Sin tokens, códigos ni keys.

## Guardrails

Sidecar NeMo / Colang en el path de IA. Fail-closed si el sidecar no responde.

## Demo

José → workspace María = 403. Download ajeno = 403. Prompt injection = `PROMPT_BLOCKED`. Pregunta por otro cliente = `OUT_OF_SCOPE`.
