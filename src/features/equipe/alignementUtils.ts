import { getObjet } from '../../data'
import type { Objet } from '../../data/types'
import type { StyleJeu } from '../../storage/useSaveData'

export interface ObjetResolu {
  objetOriginal: Objet | undefined
  objet: Objet | undefined
  alternative: Objet | undefined
  sansAlternative: boolean
  idAffiche: string
}

/**
 * Résout un objet d'équipement selon le style de jeu : un Bienveillant voit l'alternative neutre
 * d'un objet à choix sombre quand elle existe (sinon un avertissement) ; Sombre et Neutre voient
 * l'objet tel quel. Centralise la règle utilisée sur la fiche personnage et l'aperçu de groupe.
 */
export function resoudreObjetPourStyle(objetId: string, styleJeu: StyleJeu): ObjetResolu {
  const objetOriginal = getObjet(objetId)
  const aAdapter = styleJeu === 'bienveillant' && objetOriginal !== undefined && objetOriginal.alignement !== 'neutre'
  const alternative = aAdapter && objetOriginal?.alternative ? getObjet(objetOriginal.alternative) : undefined
  const objet = alternative ?? objetOriginal
  return {
    objetOriginal,
    objet,
    alternative,
    sansAlternative: aAdapter && alternative === undefined,
    idAffiche: objet?.id ?? objetId,
  }
}
