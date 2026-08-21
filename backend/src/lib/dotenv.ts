import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function hydrateDotEnv(cwd = process.cwd()) {
  const file = resolve(cwd, '.env')
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    if (process.env[key] === undefined) process.env[key] = value
  }
}
