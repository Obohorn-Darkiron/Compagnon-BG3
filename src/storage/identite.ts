/** Identifiant anonyme stable pour cet appareil, utilisé pour savoir quels personnages
 * d'une session de groupe appartiennent à ce joueur (et sont donc modifiables par lui). */
const CLE = 'bg3-companion-joueur-id'

export function lireJoueurId(): string {
  try {
    const existant = window.localStorage.getItem(CLE)
    if (existant) return existant
  } catch {
    // stockage indisponible : on retombe sur un id éphémère plus bas
  }
  const id = crypto.randomUUID()
  try {
    window.localStorage.setItem(CLE, id)
  } catch {
    // tant pis, l'id ne survivra pas à un rechargement
  }
  return id
}
