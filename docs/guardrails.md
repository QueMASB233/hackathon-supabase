# Guardrails

Sidecar Python en `backend/guardrails/` ([NVIDIA NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails)).

El API TypeScript llama `POST {GUARDRAILS_URL}/v1/check` **antes** del retrieval y **después** del modelo.

Colang: `backend/guardrails/rails.co` (jailbreak, cross-tenant). El sidecar aplica esas reglas de forma determinista y, si `nemoguardrails` está instalado y puede cargar `LLMRails`, también ejecuta el runtime NVIDIA.

Códigos hacia el PWA (sin internals):

- `PROMPT_BLOCKED`
- `OUT_OF_SCOPE`
- `AI_BLOCKED`

Si el sidecar no responde: la consulta de IA falla cerrada (`SERVER`), no se salta el rail.

Los PDFs recuperados van en un bloque de datos no confiables. Un documento que diga “ignore previous instructions” no es system prompt.
