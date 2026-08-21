import { chunkPages, chunkText, type TextChunk } from './chunking.ts'

const ALLOWED = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export const MAX_FILE_BYTES = 15 * 1024 * 1024

export function assertUploadMeta(name: string, mime: string, size: number) {
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    throw new Error('filename')
  }
  if (size <= 0 || size > MAX_FILE_BYTES) {
    throw new Error('size')
  }
  if (!ALLOWED.has(mime) && !name.match(/\.(pdf|txt|md|docx)$/i)) {
    throw new Error('mime')
  }
}

export async function extractAndChunk(
  buffer: Buffer,
  mime: string,
  filename: string,
): Promise<TextChunk[]> {
  const lower = filename.toLowerCase()
  if (mime === 'application/pdf' || lower.endsWith('.pdf')) {
    const { extractText } = await import('unpdf')
    const result = await extractText(new Uint8Array(buffer), { mergePages: false })
    const texts = Array.isArray(result.text) ? result.text : [String(result.text ?? '')]
    const pages = texts.map((text, i) => ({ page: i + 1, text }))
    const chunks = chunkPages(pages)
    return chunks.length ? chunks : chunkText(texts.join('\n\n'))
  }
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    const mammoth = await import('mammoth')
    const { value } = await mammoth.extractRawText({ buffer })
    return chunkText(value)
  }
  return chunkText(buffer.toString('utf8'))
}
