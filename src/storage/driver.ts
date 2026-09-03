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

/** true si l'écriture a réussi. Peut échouer (stockage plein, navigation privée qui bloque
 * localStorage...) — dans ce cas les données restent correctes en mémoire pour la session en
 * cours, mais ne survivront pas à une fermeture de l'appli tant que le problème n'est pas résolu. */
export function ecrireBrut(json: string): boolean {
  try {
    window.localStorage.setItem(CLE, json)
    return true
  } catch {
    return false
  }
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

/**
 * Vide tout ce que le navigateur a mis en cache pour l'appli (fichiers hors-ligne,
 * service worker) et recharge. Bouton de secours quand la vérification automatique
 * de mise à jour ne suffit pas — garantit de repartir sur la toute dernière version.
 */
export async function forcerMiseAJour(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((r) => r.unregister()))
  }
  if ('caches' in window) {
    const cles = await caches.keys()
    await Promise.all(cles.map((cle) => caches.delete(cle)))
  }
  window.location.reload()
}
