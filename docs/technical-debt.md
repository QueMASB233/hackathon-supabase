# Deuda técnica

## TD-001

### Problema

El frontend default sigue en `VITE_API_MODE=mock`.

### Impacto

Sin cambiar el env, la demo no golpea RLS real.

### Solución futura

Apuntar `http` en el entorno de demo.

### Prioridad

High

## TD-002

### Problema

El magic link depende de SMTP/Inbucket en el proyecto Supabase.

### Impacto

Sin proveedor de correo no llega el enlace de acceso. El SMTP por defecto de Supabase limita a pocos correos por hora.

### Solución futura

Configurar Auth > Providers > Email y un SMTP propio, y registrar `{APP_URL}/auth/callback` en Redirect URLs.

### Prioridad

High

## TD-003

### Problema

Upload HTTP del PWA no reporta progreso byte a byte.

### Impacto

La barra puede saltar a completo.

### Solución futura

XHR/fetch progress.

### Prioridad

Low

## TD-004

### Problema

Command palette quedó fuera (P2 frontend).

### Prioridad

Low

## TD-005

### Problema

Rate limit es in-memory por proceso.

### Impacto

No se comparte entre réplicas; se reinicia al redesplegar.

### Solución futura

Redis o tabla `rate_limit_events`.

### Prioridad

Medium

## TD-006

### Problema

Worker de documentos es in-process (`void processDocument`).

### Impacto

Un restart pierde jobs a medias (quedan `failed` o colgados).

### Solución futura

Cola persistente.

### Prioridad

Medium

## TD-007

### Problema

No hay filtro de contenido sobre la entrada ni la salida de la IA. El sidecar de guardrails se eliminó porque no estaba desplegado y hacía fallar `/api/ai/query`.

### Impacto

Un prompt de jailbreak no se bloquea explícitamente. El aislamiento entre workspaces sigue garantizado por RLS y por el `workspace_id` del retrieval, así que no hay fuga cross-tenant.

### Solución futura

Moderación in-process (por ejemplo, la API de moderación de OpenAI) en vez de un servicio aparte.

### Prioridad

Medium

## TD-008

### Problema

`POST /api/clients` devuelve `invites[].url` porque el PWA no tiene pantalla de “copiar enlace”.

### Impacto

Hay que leer la respuesta o el seed para compartir `/invite/:token`.

### Solución futura

Email transaccional o UI de invitaciones (P1).

### Prioridad

Medium
