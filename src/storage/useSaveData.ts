import { useSyncExternalStore } from 'react'
import { saveStore } from './store'

/** Lit la sauvegarde courante et se met à jour automatiquement à chaque modification. */
export function useSaveData() {
  return useSyncExternalStore(saveStore.subscribe, saveStore.getSnapshot)
}

/** true si la dernière écriture sur le stockage local a échoué — à afficher bien en évidence,
 * sinon la personne peut perdre des changements sans jamais s'en rendre compte. */
export function useEchecEcriture() {
  return useSyncExternalStore(saveStore.subscribe, saveStore.getEchecEcriture)
}

export { saveStore } from './store'
export type { Campagne, Personnage, SaveData, StyleJeu } from './schema'
