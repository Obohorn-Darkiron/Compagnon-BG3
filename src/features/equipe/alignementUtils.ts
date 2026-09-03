import { builds, getObjet } from '../../data'
import type { Importance, Objet } from '../../data/types'
import type { StyleJeu } from '../../storage/useSaveData'

export interface ObjetResolu {
  objetOriginal: Objet | undefined
  objet: Objet | undefined
  alternative: Objet | undefined
  /** true si `alternative` a été trouvée automatiquement (aucun lien vérifié en base) plutôt que choisie à la main. */
  alternativeAutoTrouvee: boolean
  sansAlternative: boolean
  idAffiche: string
}

const ORDRE_IMPORTANCE: Record<Importance, number> = {
  Essentiel: 4,
  Excellent: 3,
  Bon: 2,
  Situationnel: 1,
}

/**
 * Repli quand aucune alternative n'est vérifiée à la main sur l'objet lui-même : cherche, parmi
 * tous les objets neutres déjà utilisés par au moins un build au même emplacement, le mieux noté
 * (le plus souvent recommandé, à la meilleure importance rencontrée) — on reste dans des objets
 * déjà vérifiés utiles pour ce type d'emplacement, pas dans un choix au hasard sur les 428 objets.
 */
function trouverAlternativeAutomatique(emplacement: string, exclureId: string): Objet | undefined {
  const meilleureImportanceParObjet = new Map<string, Importance>()
  for (const b of builds) {
    for (const e of b.equipement) {
      if (e.emplacement !== emplacement || e.objetId === exclureId) continue
      const o = getObjet(e.objetId)
      if (!o || o.alignement !== 'neutre') continue
      const actuelle = meilleureImportanceParObjet.get(e.objetId)
      if (!actuelle || ORDRE_IMPORTANCE[e.importance] > ORDRE_IMPORTANCE[actuelle]) {
        meilleureImportanceParObjet.set(e.objetId, e.importance)
      }
    }
  }
  const meilleurId = [...meilleureImportanceParObjet.entries()].sort(
    (a, b) => ORDRE_IMPORTANCE[b[1]] - ORDRE_IMPORTANCE[a[1]],
  )[0]?.[0]
  return meilleurId ? getObjet(meilleurId) : undefined
}

/**
 * Résout un objet d'équipement selon le style de jeu, pour un emplacement donné.
 *
 * Seul un objet à choix moral (`alignement: 'sombre'`) est concerné par le remplacement, et
 * seulement en Bienveillant — un objet `restreint` (réservé à une origine ou un compagnon) n'a
 * rien à voir avec un choix moral et reste affiché tel quel quel que soit le style.
 *
 * Si l'objet a un `alternative` vérifiée en base, elle est utilisée en priorité. Sinon, une
 * alternative est cherchée automatiquement parmi les objets neutres déjà recommandés au même
 * emplacement ailleurs dans le catalogue.
 */
export function resoudreObjetPourStyle(objetId: string, styleJeu: StyleJeu, emplacement: string): ObjetResolu {
  const objetOriginal = getObjet(objetId)
  const aAdapter = styleJeu === 'bienveillant' && objetOriginal?.alignement === 'sombre'

  let alternative: Objet | undefined
  let alternativeAutoTrouvee = false
  if (aAdapter) {
    if (objetOriginal?.alternative) {
      alternative = getObjet(objetOriginal.alternative)
    }
    if (!alternative) {
      alternative = trouverAlternativeAutomatique(emplacement, objetId)
      alternativeAutoTrouvee = alternative !== undefined
    }
  }

  const objet = alternative ?? objetOriginal
  return {
    objetOriginal,
    objet,
    alternative,
    alternativeAutoTrouvee,
    sansAlternative: aAdapter && alternative === undefined,
    idAffiche: objet?.id ?? objetId,
  }
}
