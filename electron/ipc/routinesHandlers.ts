import { ipcMain } from 'electron'
import type { PersistedData } from '@shared/domain'
import * as store from '../persistence/store'

export function registerRoutinesHandlers(): void {
  ipcMain.handle('routines:load', async () => store.load())
  ipcMain.handle('routines:save', async (_event, data: PersistedData) => store.save(data))
}
