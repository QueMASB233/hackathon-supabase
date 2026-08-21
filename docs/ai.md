# IA

OpenAI solo en backend (`OPENAI_API_KEY` de entorno).

- Embeddings: `text-embedding-3-small` (1536)
- Chat: `gpt-4o-mini` (configurable)

`POST /api/ai/query` strea NDJSON al PWA. El modelo no recibe el system mezclado con chunks: el contexto va delimitado como datos no confiables.
