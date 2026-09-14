import { useSyncExternalStore } from 'react'

interface EvenementInstallDiffere extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let evenementDiffere: EvenementInstallDiffere | null = null
const abonnes = new Set<() => void>()

function notifier() {
  abonnes.forEach((fn) => fn())
}

// Doit être enregistré tôt (voir main.tsx) : le navigateur peut déclencher l'événement dès le
// chargement de la page, bien avant que la personne n'ouvre l'écran Paramètres — un
// addEventListener posé seulement à ce moment-là raterait l'événement.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  evenementDiffere = e as EvenementInstallDiffere
  notifier()
})

window.addEventListener('appinstalled', () => {
  evenementDiffere = null
  notifier()
})

function estDisponible(): boolean {
  return evenementDiffere !== null
}

/** true si le navigateur propose une installation native en un tap (Chrome/Edge Android
 * essentiellement) — false sur iOS Safari, qui n'a pas cette API et reste sur les instructions
 * manuelles ("Ajouter à l'écran d'accueil" dans le menu du navigateur). */
export function useInstallPromptDisponible(): boolean {
  return useSyncExternalStore(
    (fn) => {
      abonnes.add(fn)
      return () => abonnes.delete(fn)
    },
    estDisponible,
  )
}

/** Déclenche la feuille d'installation native. Ne peut être appelé qu'en réponse directe à un
 * geste utilisateur (clic) — c'est une contrainte du navigateur, pas de ce code. */
export async function declencherInstallPrompt(): Promise<'accepted' | 'dismissed' | 'indisponible'> {
  if (!evenementDiffere) return 'indisponible'
  await evenementDiffere.prompt()
  const choix = await evenementDiffere.userChoice
  evenementDiffere = null
  notifier()
  return choix.outcome
}
