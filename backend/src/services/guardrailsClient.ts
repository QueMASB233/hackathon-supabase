import type { ApiErrorCode } from '../lib/errors.ts'
import { aiBlocked, serverError } from '../lib/errors.ts'

export type GuardrailsStage = 'input' | 'output'

export type GuardrailsResult = {
  allowed: boolean
  code?: Extract<ApiErrorCode, 'AI_BLOCKED' | 'OUT_OF_SCOPE' | 'PROMPT_BLOCKED'>
  reason?: string
}

export class GuardrailsClient {
  constructor(private readonly baseUrl: string) {}

  async check(input: {
    stage: GuardrailsStage
    message: string
    workspaceName?: string
    retrievedContext?: string
  }): Promise<GuardrailsResult> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/v1/check`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(8_000),
      })
    } catch {
      throw serverError('El servicio de guardrails no está disponible.')
    }
    if (!response.ok) {
      throw serverError('El servicio de guardrails no está disponible.')
    }
    const body = (await response.json()) as GuardrailsResult
    if (!body.allowed) {
      throw aiBlocked(body.code ?? 'AI_BLOCKED')
    }
    return body
  }
}
