# Changelog

## [0.2.0]

### Added

- Backend Hono (TypeScript) en `backend/` con el contrato HTTP del PWA.
- Auth passwordless vía Supabase magic link, con callback en `/auth/callback`.
- Registro de empresas (`POST /api/auth/signup-business`) y pantalla `/signup` enlazada desde el login.
- Migrations 001–011: tenancy, invitaciones, documentos, pgvector, RLS, Storage privado.
- Pipeline de documentos (extract → chunk → embed → indexing/ready).
- RAG acotado por `workspace_id`, streaming NDJSON y sources reales.
- Sidecar NeMo Guardrails (`backend/guardrails`).
- Rate limiting, auditoría, tests de seguridad (Vitest).
- Script `npm run seed` para la demo Mathias / José / María.

### Changed

- Documentación alineada con el backend real (ya no “P0 sin API”).
- `GET /api/me` y capabilities salen del JWT + memberships, no del mock.

### Fixed

- Nada respecto a P0 de UI; el frontend no se rehízo.

## [0.1.0]

### Added

- PWA shell, auth UI, dashboard, workspace chat-first, mocks.
