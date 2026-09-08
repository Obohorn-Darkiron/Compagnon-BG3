export type StyleJeu = 'bienveillant' | 'neutre' | 'sombre' | null

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
  /** Nom d'un compagnon de l'histoire (Shadowheart, Astarion...) si ce perso EST ce compagnon — sa race est alors fixe. Null pour un perso créé librement. */
  compagnonNom: string | null
  /** joueurId du joueur propriétaire dans une session de groupe. Null = personnage local, non synchronisé. */
  proprietaireId: string | null
  /** true si ce personnage est l'origine Dark Urge — fait apparaître la checklist des moments à ne pas manquer. */
  estDarkUrge: boolean
  /** Identifiants de jalonsDarkUrge (voir data/darkUrge.json) déjà cochés comme "passés" par le joueur. */
  jalonsSombresCoches: string[]
}

export interface JoueurSession {
  joueurId: string
  /** Rang d'arrivée dans la session (1 = créateur), affiché "J1", "J2"... */
  numero: number
  /** Nom du joueur (distinct du nom de son personnage), modifiable à tout moment. */
  nom: string
  /** Coché manuellement par le joueur — togglable, jamais définitif. */
  pret: boolean
}

export interface Campagne {
  id: string
  nom: string
  personnages: Personnage[]
  /** Noms des compagnons de l'histoire (Shadowheart, Astarion...) recrutés dans cette campagne. */
  compagnonsRecrutes: string[]
  /** Code de session de groupe partagée (ex. "K7XQ2M"). Null = campagne purement locale. */
  sessionCode: string | null
  /** true si CE joueur a créé la session en cours — seul lui peut la supprimer pour tout le monde. */
  sessionEstProprietaire: boolean
  /** Nombre de places choisi par le créateur à la création (2 à 4). Null pour une session créée
   * avant l'ajout du lobby, ou hors session — dans ce cas pas d'écran lobby, l'app se comporte
   * comme avant. */
  sessionTailleMax: number | null
  /** Roster des joueurs de la session (numéro, nom, prêt), synchronisé en direct. */
  sessionJoueurs: JoueurSession[]
  /** true une fois que l'hôte a confirmé le groupe — bascule vers l'app normale. Rien n'est
   * verrouillé pour autant : les builds restent modifiables après. */
  sessionConfirmee: boolean
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
