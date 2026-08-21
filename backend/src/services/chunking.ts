const TARGET = 900
const OVERLAP = 120

export type TextChunk = {
  index: number
  content: string
  page: number | null
}

export function chunkText(text: string, page: number | null = null): TextChunk[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim()
  if (!normalized) return []
  const parts: TextChunk[] = []
  let start = 0
  let index = 0
  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + TARGET)
    const slice = normalized.slice(start, end).trim()
    if (slice) {
      parts.push({ index, content: slice, page })
      index += 1
    }
    if (end >= normalized.length) break
    start = Math.max(end - OVERLAP, start + 1)
  }
  return parts
}

export function chunkPages(pages: Array<{ page: number; text: string }>): TextChunk[] {
  const all: TextChunk[] = []
  let index = 0
  for (const page of pages) {
    for (const chunk of chunkText(page.text, page.page)) {
      all.push({ ...chunk, index })
      index += 1
    }
  }
  return all
}
