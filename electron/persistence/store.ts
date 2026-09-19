import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import type { PersistedData } from '@shared/domain'
import { EMPTY_PERSISTED_DATA } from '@shared/domain'

function filePath(): string {
  return join(app.getPath('userData'), 'routines.json')
}

export async function load(): Promise<PersistedData> {
  try {
    const raw = await fs.readFile(filePath(), 'utf-8')
    const parsed = JSON.parse(raw) as PersistedData
    if (parsed && parsed.version === 1 && Array.isArray(parsed.routines)) {
      return parsed
    }
    return EMPTY_PERSISTED_DATA
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      await save(EMPTY_PERSISTED_DATA)
      return EMPTY_PERSISTED_DATA
    }
    throw err
  }
}

export async function save(data: PersistedData): Promise<void> {
  const target = filePath()
  const tmp = `${target}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8')
  await fs.rename(tmp, target)
}
