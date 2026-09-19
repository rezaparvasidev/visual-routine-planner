import type { PersistedData } from '@shared/domain'

export {}

declare global {
  interface Window {
    routinesAPI: {
      load: () => Promise<PersistedData>
      save: (data: PersistedData) => Promise<void>
    }
  }
}
