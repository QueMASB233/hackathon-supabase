import type { SupabaseClient } from '@supabase/supabase-js'
import { DOCUMENT_STATUS_LABEL } from '../lib/labels.ts'
import { extractAndChunk } from './extract.ts'
import type { OpenAiService } from './openai.ts'
import { writeAudit } from './audit.ts'

export async function processDocument(params: {
  userClient: SupabaseClient
  admin: SupabaseClient
  openai: OpenAiService
  documentId: string
  workspaceId: string
  buffer: Buffer
  mime: string
  filename: string
  actorUserId: string
}) {
  const setStatus = async (status: string) => {
    await params.userClient
      .from('documents')
      .update({ status, status_label: DOCUMENT_STATUS_LABEL[status] ?? status })
      .eq('id', params.documentId)
  }

  try {
    await setStatus('processing')
    const chunks = await extractAndChunk(params.buffer, params.mime, params.filename)
    await setStatus('chunking')
    const rows = []
    await setStatus('indexing')
    for (const chunk of chunks) {
      let embedding: number[] | null = null
      if (params.openai.enabled()) {
        embedding = await params.openai.embed(chunk.content)
      }
      rows.push({
        workspace_id: params.workspaceId,
        document_id: params.documentId,
        chunk_index: chunk.index,
        content: chunk.content,
        page: chunk.page,
        filename: params.filename,
        embedding: embedding ? (`[${embedding.join(',')}]` as unknown as number[]) : null,
        metadata: { page: chunk.page },
      })
    }
    if (rows.length) {
      const { error } = await params.userClient.from('document_chunks').insert(rows)
      if (error) throw error
    }
    await setStatus('ready')
    await writeAudit(params.admin, {
      actorUserId: params.actorUserId,
      workspaceId: params.workspaceId,
      action: 'DOCUMENT_PROCESSED',
      resourceType: 'document',
      resourceId: params.documentId,
    })
  } catch {
    await setStatus('failed')
  }
}
