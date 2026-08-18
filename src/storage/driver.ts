/**
 * Boîte à outils de sauvegarde. Aujourd'hui : localStorage.
 * Pour migrer vers IndexedDB (ou autre) plus tard, seule cette
 * fonction change — le reste de l'appli passe toujours par lireSauvegarde/ecrireSauvegarde.
 */
const CLE = 'bg3-companion-save'

export function lireBrut(): string | null {
  try {
    return window.localStorage.getItem(CLE)
  } catch {
    return null
  }
}

export function ecrireBrut(json: string): void {
  window.localStorage.setItem(CLE, json)
}

/**
 * Demande au navigateur de ne pas effacer les données de l'appli pour libérer
 * de la place. Sans ça, un onglet non installé sur l'écran d'accueil peut se
 * faire vider automatiquement par le téléphone en cas de manque de stockage.
 */
export function demanderStockagePersistant(): void {
  navigator.storage?.persist?.().catch(() => {})
}

export async function stockageEstPersistant(): Promise<boolean | null> {
  if (!navigator.storage?.persisted) return null
  try {
    return await navigator.storage.persisted()
  } catch {
    return null
  }
}
