export type StyleJeu = 'bienveillant' | 'neutre' | null

export interface Personnage {
  id: string
  nom: string
  classe: string | null
  sousClasse: string | null
  buildId: string | null
  race: string | null
  sousRace: string | null
  styleJeu: StyleJeu
  niveau: number
  objetsObtenus: string[]
  /** Pour les bonus permanents à choix libre (stat et/ou valeur) : { [objetId]: { stat, valeur } }. */
  choixBonusPermanents: Record<string, { stat: string; valeur: number }>
}

export interface Campagne {
  id: string
  nom: string
  personnages: Personnage[]
  /** Noms des compagnons de l'histoire (Shadowheart, Astarion...) recrutés dans cette campagne. */
  compagnonsRecrutes: string[]
}

export interface SaveData {
  saveVersion: number
  campagneActiveId: string | null
  campagnes: Campagne[]
}

export const SAVE_VERSION = 1

export function saveDataVide(): SaveData {
  return {
    saveVersion: SAVE_VERSION,
    campagneActiveId: null,
    campagnes: [],
  }
}
