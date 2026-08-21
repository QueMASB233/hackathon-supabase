import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnv } from '../config/env.ts'
import { hydrateDotEnv } from '../lib/dotenv.ts'
import { createAdminClient } from '../lib/supabase.ts'
import { sha256, randomToken } from '../lib/hash.ts'

hydrateDotEnv()

async function upsertUser(admin: ReturnType<typeof createAdminClient>, email: string, displayName: string) {
  const { data: existing } = await admin.auth.admin.listUsers()
  const found = existing.users.find((u) => u.email === email)
  if (found) {
    await admin.from('profiles').upsert({ id: found.id, email, display_name: displayName })
    return found.id
  }
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (created.error || !created.data.user) throw created.error
  await admin.from('profiles').upsert({
    id: created.data.user.id,
    email,
    display_name: displayName,
  })
  return created.data.user.id
}

async function main() {
  const env = loadEnv()
  const admin = createAdminClient(env)

  const mathiasId = await upsertUser(admin, 'mathias@mathias.sa', 'Mathias S.A.')
  const joseId = await upsertUser(admin, 'jose@email.com', 'José S.A.')

  const { data: business } = await admin
    .from('businesses')
    .upsert({ owner_id: mathiasId, name: 'Mathias S.A.' }, { onConflict: 'owner_id' })
    .select()
    .maybeSingle()

  let businessId = business?.id as string | undefined
  if (!businessId) {
    const inserted = await admin.from('businesses').insert({ owner_id: mathiasId, name: 'Mathias S.A.' }).select().single()
    businessId = inserted.data?.id
  }
  if (!businessId) throw new Error('Could not create business')

  async function ensureClient(name: string, description: string, email: string | null) {
    const { data: existing } = await admin.from('clients').select('*').eq('business_id', businessId!).eq('name', name).maybeSingle()
    const client =
      existing ??
      (
        await admin
          .from('clients')
          .insert({ business_id: businessId, name, description, status: 'Cliente activo' })
          .select()
          .single()
      ).data
    if (!client) throw new Error('client')
    let { data: workspace } = await admin.from('workspaces').select('*').eq('client_id', client.id).maybeSingle()
    if (!workspace) {
      workspace = (
        await admin
          .from('workspaces')
          .insert({ business_id: businessId, client_id: client.id, name, description })
          .select()
          .single()
      ).data
    }
    if (!workspace) throw new Error('workspace')
    await admin.from('workspace_members').upsert({
      workspace_id: workspace.id,
      user_id: mathiasId,
      role: 'business',
    })
    if (email === 'jose@email.com') {
      await admin.from('workspace_members').upsert({
        workspace_id: workspace.id,
        user_id: joseId,
        role: 'client',
      })
    }
    return { client, workspace }
  }

  const jose = await ensureClient('José S.A.', 'Cliente de servicios de marketing.', 'jose@email.com')
  const maria = await ensureClient('María S.A.', 'Retail y campañas regionales.', null)

  const inviteToken = randomToken()
  await admin.from('invitations').upsert(
    {
      token_hash: sha256(inviteToken),
      email: 'contacto@jose.com',
      workspace_id: jose.workspace.id,
      client_id: jose.client.id,
      invited_by: mathiasId,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'token_hash' },
  )

  const fixtures = [
    { name: 'contrato-2026.txt', file: 'contrato-2026.txt' },
    { name: 'reunion-12-agosto.txt', file: 'reunion-12-agosto.txt' },
  ]
  for (const fixture of fixtures) {
    const path = resolve(process.cwd(), 'fixtures', fixture.file)
    const body = readFileSync(path)
    const { data: existingDoc } = await admin
      .from('documents')
      .select('id')
      .eq('workspace_id', jose.workspace.id)
      .eq('name', fixture.name)
      .maybeSingle()
    if (existingDoc) continue
    const { randomUUID } = await import('node:crypto')
    const documentId = randomUUID()
    const storagePath = `workspaces/${jose.workspace.id}/documents/${documentId}/file`
    await admin.storage.from('workspace-documents').upload(storagePath, body, {
      contentType: 'text/plain',
      upsert: true,
    })
    await admin.from('documents').insert({
      id: documentId,
      workspace_id: jose.workspace.id,
      uploaded_by: mathiasId,
      name: fixture.name,
      mime_type: 'text/plain',
      size_bytes: body.length,
      storage_path: storagePath,
      status: 'ready',
      status_label: 'Listo',
    })
  }

  console.info('Seed complete.')
  console.info(`José workspace: ${jose.workspace.id}`)
  console.info(`María workspace: ${maria.workspace.id}`)
  console.info(`Invite path: /invite/${inviteToken}`)
  console.info('Login uses Supabase email OTP (no password). Enable Email OTP in the Auth providers.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'seed failed')
  process.exit(1)
})
