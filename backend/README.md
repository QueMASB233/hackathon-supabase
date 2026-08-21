# Backend

El frontend de SecureWorkspace **nunca** habla con PostgreSQL, Storage ni RLS.

Este directorio alojará la API (auth, autorización, RAG, OpenAI, NeMo Guardrails, rate limiting, auditoría).

En P0 el backend **no está implementado**. El frontend usa `VITE_API_MODE=mock`.

Cuando exista, el contrato esperado está en [`docs/api.md`](../docs/api.md).

No colocar secretos en el repositorio. OpenAI, `service_role` y passwords viven solo en environment del servidor.
