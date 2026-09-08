/** Lien public de l'appli — calculé plutôt que codé en dur pour rester correct si l'origine ou
 * le sous-chemin de déploiement change. */
export const lienApp = `${window.location.origin}${import.meta.env.BASE_URL}`

/** Partage le lien de l'appli via le partage natif du téléphone (Discord, WhatsApp, SMS...) si
 * disponible, sinon le copie dans le presse-papiers. Retourne comment ça s'est passé, pour que
 * l'appelant affiche le bon retour ("Partagé" vs "Lien copié !") — ou rien si l'utilisateur a
 * annulé la feuille de partage native. */
export async function partagerApp(): Promise<'partage' | 'copie' | 'annule'> {
  const donnees = {
    title: 'BG3 Compagnon',
    text: 'Rejoins-moi sur BG3 Compagnon pour organiser notre run de Baldur\'s Gate 3 !',
    url: lienApp,
  }
  if (navigator.share && (!navigator.canShare || navigator.canShare(donnees))) {
    try {
      await navigator.share(donnees)
      return 'partage'
    } catch (err) {
      // AbortError : la personne a fermé la feuille de partage sans rien choisir — pas une
      // erreur, on ne retombe pas sur la copie pour ne pas la surprendre.
      if (err instanceof Error && err.name === 'AbortError') return 'annule'
      // Autre échec (rare) : on retombe sur la copie.
    }
  }
  await navigator.clipboard.writeText(lienApp)
  return 'copie'
}
