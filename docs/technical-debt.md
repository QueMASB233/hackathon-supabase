# Deuda técnica

## TD-001

### Problema

El frontend corre contra `src/api/adapters/mock`, no contra un backend real.

### Impacto

Los datos, permisos y respuestas de IA son de demostración. No hay seguridad real ni RAG.

### Solución futura

Implementar backend, apuntar `VITE_API_MODE=http`, borrar o aislar mocks de producción.

### Prioridad

High

## TD-002

### Problema

Auth passwordless está mockeada (código fijo `123456`). No hay envío real de correo ni Supabase Auth.

### Impacto

Cualquiera que conozca el demo entra. Inaceptable en producción.

### Solución futura

Backend + Supabase Auth (OTP). Frontend ya habla `requestCode` / `verifyCode`.

### Prioridad

High

## TD-003

### Problema

Upload HTTP no reporta progreso byte a byte en el adapter `http` (el mock sí simula).

### Impacto

La barra de progreso en modo live puede saltar a completo.

### Solución futura

XHR o fetch con progreso cuando el backend exista.

### Prioridad

Low

## TD-004

### Problema

Command palette quedó fuera (P2).

### Impacto

Atajos de teclado limitados.

### Solución futura

P2.

### Prioridad

Low
