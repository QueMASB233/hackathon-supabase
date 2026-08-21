# RAG

Flujo:

1. Auth + membership + `ai.query`
2. Rate limit
3. Embedding de la pregunta (OpenAI)
4. `match_document_chunks` **con `workspace_id` autorizado**
5. Contexto en `<UNTRUSTED_WORKSPACE_DOCUMENTS>` (DATA, no instrucciones)
6. OpenAI stream
7. Sources reales (documento + locator). Nunca inventadas.
8. Audit

Formatos de extracción: PDF, TXT/Markdown, DOCX.

Estados de documento expuestos al PWA: `processing → chunking → indexing → ready | failed`.
