# Frontend

PWA Vite + React + TypeScript. Cliente 100% dumb.

## Identidad

Papel carbón / archivo de seguridad. Tokens:

- carbon `#D7E0DC` fondo
- chamber `#0E2428` boot y chrome denso
- ink `#14242A` texto
- seal `#1B6B5A` acento autorizado
- brass `#A6843C` metadatos
- alert `#9B3A3A` error

Display: Bricolage Grotesque. Body: Source Sans 3. Mono: IBM Plex Mono.

Signature: boot tipo sistema (corto) y Ask Chamber con marca de agua del cliente.

## Árbol

```
frontend/src/
  api/            adapters, tipos, errores
  components/     design system, boot, PWA, workspace rail
  pages/
  layouts/
  stores/         UI + toasts
  lib/
  styles via index.css
```

## Estado

Servidor (Query): `me`, clients, workspace, documents, conversations, messages, audit.

UI (Zustand): sidebar, boot, composer, toasts.

## Mocks

`VITE_API_MODE=mock` (default). Implementación únicamente en `src/api/adapters/mock/`. Documentado como deuda TD-001: los mocks no deben sobrevivir como fuente de verdad.

## Optimistic UI

Seguro en: nueva conversación, enviar mensaje, renombrar (cuando se use), eliminar documento en lista. Si el API rechaza, rollback.

No se asume autorización. Un 403 no deja el objeto “como si hubiera pasado”.

## Loading

Boot global solo en cold start autenticado. Listas: skeletons. Chat: burbuja streaming. Upload: barra + estados que manda el API (`processing` → `chunking` → `indexing` → `ready` | `failed`).

`prefers-reduced-motion`: el boot se omite; el resto cae a fades cortos vía CSS.

## PWA

`vite-plugin-pwa`, `registerType: 'prompt'`. Banner offline. No se encolan queries de IA ni uploads críticos.

## Auth UI

`/login` correo → `/verify` código. `/invite/:token` confirma correo y sigue al código. Sin password.

## Definition of done (P0)

Pantallas de auth, shell, dashboard, workspace chat, documentos, conversaciones, PWA, loading, empty/error, adapters, sin secretos, sin DB directa.
