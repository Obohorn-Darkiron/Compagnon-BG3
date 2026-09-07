export type Importance = 'Essentiel' | 'Excellent' | 'Bon' | 'Situationnel'

export interface CaracDepart {
  FOR: number
  DEX: number
  CON: number
  INT: number
  SAG: number
  CHA: number
}

export interface Jalon {
  etape: string
  note: string
}

/** Un choix de sort à ce niveau, affiché groupé par type sur la fiche de progression. */
export interface ChoixSort {
  nom: string
  /** nouveau = sort/cantrip choisi ; toujoursPrepare = sort de domaine automatique (ne coûte pas d'emplacement) ; echange = remplace un sort déjà connu (Ensorceleur/Occultiste/Barde/Rôdeur — voir `ancien`). */
  type: 'nouveau' | 'toujoursPrepare' | 'echange'
  /** Nom du sort remplacé — uniquement pour type 'echange'. */
  ancien?: string
  note?: string
}

/** Don pris à ce niveau : nom (nature) et effet séparés pour un affichage en deux temps. */
export interface DonProgression {
  nom: string
  effet: string
}

export interface EtapeProgression {
  niveau: number
  /** Résumé COURT de la nature de ce niveau (ex. "Nouveau don", "Sorts de niveau 2", "Spécialisation", "Rage débloquée") — pas une phrase descriptive, juste une étiquette. */
  titre: string
  /** Explication des capacités de classe propres à ce niveau — ne doit PAS répéter le contenu déjà couvert par `don` ou `sorts` (affichés séparément). Vide si le niveau n'apporte que ça. */
  detail: string
  /** Don pris à ce niveau, si applicable — affiché en évidence, nom en gras puis effet en dessous. */
  don?: DonProgression
  /** Choix de sorts à ce niveau, si applicable — groupés par type (nouveau / toujours préparé / échange). */
  sorts?: ChoixSort[]
}

export interface EquipementRecommande {
  emplacement: string
  objetId: string
  importance: Importance
  acte: number
}

export type RoleTag = 'tank' | 'soin' | 'controle' | 'degatsMelee' | 'degatsDistance' | 'utilitaire'

export type ElementTag =
  | 'feu'
  | 'glace'
  | 'foudre'
  | 'poison'
  | 'acide'
  | 'necrotique'
  | 'radiant'
  | 'tonnerre'
  | 'psychique'

/** Mécanique de jeu centrale que le build cherche activement à exploiter (pas une simple
 * mention en passant) — pour la recherche par style de jeu, comme `elements` pour les dégâts. */
export type MecaniqueTag = 'critique'

export interface Build {
  id: string
  classe: string
  sousClasse: string
  nom: string
  split: string
  role: string
  resume: string
  caracDepart: CaracDepart
  forces: string[]
  faiblesses: string[]
  synergies?: string[]
  dons: string[]
  sortsCles: string[]
  jalons: Jalon[]
  progression: EtapeProgression[]
  equipement: EquipementRecommande[]
  roles: RoleTag[]
  /** Types de dégâts dominants du build — pour la recherche par élément. Vide si non pertinent (build purement physique). */
  elements: ElementTag[]
  /** Mécaniques centrales activement exploitées (ex. critique). Vide si aucune ne s'applique. */
  mecaniques: MecaniqueTag[]
}

export interface SousClasseInfo {
  classe: string
  nom: string
  resume: string
  avantages: string[]
  inconvenients: string[]
}

export interface SousRaceInfo {
  nom: string
  particularites: string[]
}

export interface RaceInfo {
  nom: string
  resume: string
  particularites: string[]
  /** true si les traits listés sont vérifiés précisément (bg3.wiki) — sinon résumé qualitatif prudent. */
  verifie: boolean
  sousRaces?: SousRaceInfo[]
}

export interface JalonSombre {
  id: string
  acte: number
  /** Décrit seulement le lieu/moment (jamais le contenu ni l'issue) — pense "marqueur", pas "spoil". */
  label: string
}

export type Alignement = 'neutre' | 'sombre' | 'restreint'

export interface Objet {
  id: string
  nomEn: string
  nomFr: string | null
  type: string
  rarete: string
  acte: number
  zone: string
  obtention: string
  effet: string
  verifie: boolean
  aConfirmer: string[]
  alignement: Alignement
  alignementNote?: string
  alternative?: string
}
