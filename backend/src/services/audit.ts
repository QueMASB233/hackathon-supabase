import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditInput = {
  actorUserId?: string | null
  workspaceId?: string | null
  action: string
  resourceType?: string
  resourceId?: string | null
  metadata?: Record<string, unknown>
}

export async function writeAudit(admin: SupabaseClient, input: AuditInput) {
  const { error } = await admin.from('audit_logs').insert({
    actor_user_id: input.actorUserId ?? null,
    workspace_id: input.workspaceId ?? null,
    action: input.action,
    resource_type: input.resourceType ?? null,
    resource_id: input.resourceId ?? null,
    metadata: input.metadata ?? {},
  })
  if (error) {
    // Audit must never leak secrets; swallow insert errors after process log by caller.
    return { ok: false as const, error: error.message }
  }
  return { ok: true as const }
}
