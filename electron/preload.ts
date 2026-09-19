import { contextBridge, ipcRenderer } from 'electron'
import type { PersistedData } from '@shared/domain'

const routinesAPI = {
  load: (): Promise<PersistedData> => ipcRenderer.invoke('routines:load'),
  save: (data: PersistedData): Promise<void> => ipcRenderer.invoke('routines:save', data)
}

contextBridge.exposeInMainWorld('routinesAPI', routinesAPI)

export type RoutinesAPI = typeof routinesAPI
