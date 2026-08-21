# RAG

Flujo real (backend, no navegador):

Documento → Storage → extracción → chunking → embeddings → vector store → conocimiento del workspace → query.

El frontend solo muestra estados de documento y fuentes que el API devuelve. Nunca inventa citas.

P0: el mock simula respuestas y `SourceRef`. No hay embeddings ni OpenAI en el cliente.
