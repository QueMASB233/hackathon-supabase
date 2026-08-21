# Seguridad

Autoridad: Auth JWT → autorización en API → RLS → Storage policies → rate limit → audit.

El frontend no es la seguridad.

## Auth

Dos caminos, ambos resueltos por Supabase Auth:

- **Empresas**: correo + contraseña (mínimo 8 caracteres). El backend nunca almacena ni compara la contraseña; delega en `signInWithPassword`.
- **Clientes invitados**: magic link. Supabase verifica el enlace y el backend revalida el JWT con `auth.getUser` antes de aprovisionar. El `access_token` llega en el fragmento de la URL y el PWA lo borra del historial con `replaceState` apenas lo consume.

Pedir un magic link para una cuenta de empresa se rechaza: esas cuentas entran con contraseña. El rol nunca viaja en el body; lo deriva el backend.

## Autorización

`workspace_members.role` + `permissionsFor`. Client: ver/descargar/chat/IA. Business: clientes, upload, delete, audit.

GET workspace ajeno → `403 FORBIDDEN` y evento `ACCESS_DENIED`. RLS devolvería cero filas aunque se omitiera el check.

## Storage

Bucket privado `workspace-documents`. Business: insert/update/delete. Member: select/download. Client no sube ni borra.

## Rate limit

In-memory por IP+ruta en: login, signup-business, request-link, resend-link, session, accept invite, upload, AI. `429 RATE_LIMITED`.

## Audit

Eventos: LOGIN, INVITATION_*, CLIENT_CREATED, WORKSPACE_CREATED, DOCUMENT_*, CONVERSATION_CREATED, AI_QUERY, AI_RESPONSE, ACCESS_DENIED, RATE_LIMITED (vía warn). Sin tokens, códigos ni keys.

## Prompt injection

El contexto recuperado viaja en un bloque de datos no confiables (`<UNTRUSTED_WORKSPACE_DOCUMENTS>`). Un documento que diga "ignore previous instructions" no es system prompt. El aislamiento entre clientes lo garantiza RLS + el `workspace_id` autorizado del retrieval, no un filtro de texto.

## Demo

José → workspace María = 403. Download ajeno = 403. La IA solo ve chunks del workspace autorizado.
