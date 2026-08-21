# RAG

Flujo:

1. Auth + membership + `ai.query`
2. Rate limit
3. Guardrails input
4. Embedding de la pregunta (OpenAI)
5. `match_document_chunks` **con `workspace_id` autorizado**
6. Contexto en `<UNTRUSTED_WORKSPACE_DOCUMENTS>` (DATA, no instrucciones)
7. OpenAI stream
8. Guardrails output
9. Sources reales (documento + locator). Nunca inventadas.
10. Audit

Formatos de extracción: PDF, TXT/Markdown, DOCX.

Estados de documento expuestos al PWA: `processing → chunking → indexing → ready | failed`.
