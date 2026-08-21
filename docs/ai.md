# IA

OpenAI vive solo en el backend, por environment.

Flujo: Frontend → API → authz → guardrails → RAG → OpenAI → respuesta.

`POST /api/ai/query` puede streamear. El PWA pinta tokens y luego `sources`.

No hay `OPENAI_API_KEY` en frontend, README ni docs públicas con valores reales.
