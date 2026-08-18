import { useSyncExternalStore } from 'react'
import { saveStore } from './store'

/** Lit la sauvegarde courante et se met à jour automatiquement à chaque modification. */
export function useSaveData() {
  return useSyncExternalStore(saveStore.subscribe, saveStore.getSnapshot)
}

export { saveStore } from './store'
export type { Campagne, Personnage, SaveData, StyleJeu } from './schema'
