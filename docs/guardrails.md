# Guardrails

El backend debe incorporar [NVIDIA NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails).

El frontend está preparado para códigos:

- `403` / `AI_BLOCKED`
- `OUT_OF_SCOPE`
- `PROMPT_BLOCKED`
- `RATE_LIMITED`

Copy de producto, sin internals del rail.

Ejemplo: “Esta solicitud está fuera del alcance de este workspace.”

En el mock: preguntas con “María” / otro cliente → `OUT_OF_SCOPE`; jailbreak → `PROMPT_BLOCKED`.
