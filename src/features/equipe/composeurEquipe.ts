import { builds, estMulticlasse, getObjet, nomAffiche } from '../../data'
import type { Build, RoleTag } from '../../data'

export type GenreGroupe = 'equilibre' | 'offensif' | 'atypique'
export type PreferenceSoin = 'oui' | 'non' | 'peu-importe'
export type StyleCombat = 'melee' | 'distance' | 'peu-importe'
export type PreferenceMulticlasse = 'mono' | 'multi' | 'peu-importe'

type Bucket = 'tank' | 'soin' | 'controle' | 'degats'

interface Besoins {
  tank: number
  soin: number
  controle: number
  degats: number
}

const PROFILS: Record<GenreGroupe, Besoins> = {
  equilibre: { tank: 1, soin: 1, controle: 1, degats: 1 },
  offensif: { tank: 0, soin: 0, controle: 1, degats: 3 },
  atypique: { tank: 1, soin: 0, controle: 1, degats: 2 },
}

const LABELS_GENRE: Record<GenreGroupe, string> = {
  equilibre: 'Équilibrée',
  offensif: 'Offensive',
  atypique: 'Atypique',
}

const LABELS_BUCKET: Record<Bucket, string> = {
  tank: 'Tank',
  soin: 'Soin',
  controle: 'Contrôle',
  degats: 'Dégâts',
}

export const LABELS_ROLE: Record<RoleTag, string> = {
  tank: 'Tank',
  soin: 'Soin',
  controle: 'Contrôle',
  degatsMelee: 'Dégâts mêlée',
  degatsDistance: 'Dégâts distance',
  utilitaire: 'Utilitaire',
}

/** Picks fréquents dans la communauté BG3 — sert à orienter le mode "atypique" et le curseur "surprises". */
const BUILDS_CLASSIQUES = new Set([
  'guerrier-maitre-de-guerre',
  'occultiste-lame-maudite',
  'roublard-assassin-pur',
  'magicien-evocation',
  'clerc-vie',
  'barbare-berserker',
  'paladin-vengeance-occultiste',
  'druide-lune',
  'gloomstalker-assassin-guerrier',
  'rodeur-chasseur',
])

function possedeSort(build: Build, motif: RegExp): boolean {
  return build.sortsCles.some((s) => motif.test(s))
}

/**
 * Synergies mécaniques réelles de BG3 entre deux membres du groupe. Chaque règle est volontairement
 * prudente : elle ne s'appuie que sur des sorts listés dans nos données ou des mécaniques de classe
 * confirmées (Aura de protection niv. 6, Inspiration bardique, Sculpteur de sorts...), jamais sur une
 * supposition de liste de sorts non vérifiée.
 */
interface RegleSynergie {
  id: string
  label: string
  aTag: (b: Build) => boolean
  bTag: (b: Build) => boolean
  description: (nomA: string, nomB: string) => string
}

const REGLES_SYNERGIE: RegleSynergie[] = [
  {
    id: 'sculpteur-melee',
    label: 'Zone de dégâts sans risque pour les alliés',
    aTag: (b) => b.id === 'magicien-evocation',
    bTag: (b) => b.roles.includes('degatsMelee'),
    description: (a, b) =>
      `Le Sculpteur de sorts du Magicien Évocation épargne automatiquement ses alliés dans une zone d'effet — ${a} peut lancer sa Boule de feu sans jamais toucher ${b}, qui peut foncer au contact sans crainte.`,
  },
  {
    id: 'controle-zone-melee',
    label: 'Contrôle de zone + finisseur au contact',
    aTag: (b) => possedeSort(b, /Toile d'araignée|Croissance d'épines|Nuage nauséabond|Immobilis/),
    bTag: (b) => b.roles.includes('degatsMelee'),
    description: (a, b) =>
      `${a} regroupe ou immobilise les ennemis (Restrained/Immobilisé donne l'avantage aux attaquants), ce qui facilite grandement le travail au corps-à-corps de ${b}.`,
  },
  {
    id: 'controle-sournois',
    label: 'Ennemi neutralisé + Attaque sournoise',
    aTag: (b) => possedeSort(b, /Injonction|Immobilis|Domination/),
    bTag: (b) => b.classe === 'Roublard',
    description: (a, b) =>
      `Un ennemi immobilisé ou à terre par ${a} donne l'avantage aux attaques de mêlée à son contact — exactement ce qu'il faut pour déclencher l'Attaque sournoise de ${b} sans dépendre du hasard.`,
  },
  {
    id: 'barde-carry',
    label: 'Inspiration bardique sur le DPS',
    aTag: (b) => b.classe === 'Barde',
    bTag: (b) => b.roles.includes('degatsMelee') || b.roles.includes('degatsDistance'),
    description: (a, b) =>
      `${a} peut offrir son Inspiration bardique à ${b} pour fiabiliser un jet d'attaque ou de dégâts au moment décisif du combat.`,
  },
  {
    id: 'aura-protection',
    label: 'Aura de protection sur un caster fragile',
    aTag: (b) => b.classe === 'Paladin',
    bTag: (b) => b.roles.includes('controle') && b.classe !== 'Paladin',
    description: (a, b) =>
      `Dès le niveau 6, l'Aura de protection de ${a} ajoute son bonus de Charisme aux jets de sauvegarde de tous les alliés proches — précieux pour protéger la concentration de ${b} face aux contrôles ennemis.`,
  },
  {
    id: 'hate-carry',
    label: 'Hâte sur le DPS',
    aTag: (b) => possedeSort(b, /Hâte/),
    bTag: (b) => b.roles.includes('degatsMelee') || b.roles.includes('degatsDistance'),
    description: (a, b) =>
      `${a} peut lancer Hâte sur ${b} pour lui offrir une action supplémentaire et +2 à la CA pendant les combats clés.`,
  },
  {
    id: 'eau-foudre-electrocution',
    label: 'Combo Eau + Foudre (Électrocution)',
    aTag: (b) => b.id === 'magicien-conjuration',
    bTag: (b) => b.elements.includes('foudre'),
    description: (a, b) =>
      `${a} peut créer une flaque d'eau au sol (Conjuration mineure) ; un sort de foudre de ${b} lancé dans cette zone Électrocute tous les ennemis qui s'y trouvent, dégâts en plus. Attention : l'Électrocution touche aussi vos propres alliés s'ils sont dans l'eau — coordonnez le timing avant de foudroyer.`,
  },
  {
    id: 'tenebres',
    label: 'Obscurité totale à exploiter',
    aTag: (b) => possedeSort(b, /Ténèbres/),
    bTag: (b) => b.roles.includes('degatsMelee') && b.classe !== 'Occultiste',
    description: (a, b) =>
      `${a} peut plonger une zone dans les Ténèbres (obscurité totale, tir à distance quasi impossible pour l'ennemi). Attention : la Vision dans le noir de race, même Supérieure (Drow, Duergar...), NE fonctionne PAS contre une obscurité magique comme ce sort. La seule solution fiable est l'invocation Vision des ténèbres de l'Occultiste (n'importe quel patron) — donne-la à ${a} lui-même ou à un deuxième Occultiste du groupe pour qu'il se batte à distance en toute sécurité dans le noir. Pour ${b} qui reste au contact, ça n'aide pas directement à voir, mais l'ennemi aveugle rate ses attaques à distance contre lui — profite plutôt de la couverture.`,
  },
]

interface ReglaConseilRace {
  id: string
  /** Doit correspondre exactement à un `race` de races.json / CompagnonInfo, pour que le composeur
   * d'équipe puisse aussi s'en servir pour décider qui créer soi-même vs qui recruter. */
  race: string
  label: string
  cible: (b: Build) => boolean
  description: (nomCible: string) => string
}

const donCorrespond = (b: Build, motif: RegExp) => b.dons.some((d) => motif.test(d))

/**
 * Conseils de race indépendants des paires — uniquement quand une race a un effet mécanique réel et
 * vérifié (bg3.wiki), jamais une suggestion générique "pour le style". Sert à la fois à l'affichage
 * (fiche de build, aperçu de groupe) et au composeur d'équipe pour prioriser qui créer soi-même.
 */
const CONSEILS_RACE: ReglaConseilRace[] = [
  {
    id: 'duergar-force-burst',
    race: 'Nain',
    label: 'Nain (Duergar) pour un coup de boost sans Concentration',
    cible: (b) => b.roles.includes('degatsMelee') && b.caracDepart.FOR >= 16,
    description: (nom) =>
      `Pour ${nom}, la sous-race Duergar (Nain) apporte Agrandissement une fois par repos long, sans dépenser de Concentration ni d'emplacement de sort : bonus aux dégâts et avantage aux tests de Force pendant qu'il est actif — un vrai coup de boost gratuit sur un profil déjà orienté Force.`,
  },
  {
    id: 'demi-orc-melee',
    race: 'Demi-Orc',
    label: 'Demi-Orc pour ton pilier de mêlée',
    cible: (b) => b.roles.includes('degatsMelee'),
    description: (nom) =>
      `Pour ${nom}, la race Demi-Orc est un choix mécaniquement très solide : Endurance implacable (tomber à 0 PV te laisse à 1 PV une fois par repos long) et Attaques sauvages (dé de dégâts supplémentaire sur un critique en mêlée) — deux traits qui profitent directement à un profil au contact.`,
  },
  {
    id: 'gnome-controle-caster',
    race: 'Gnome',
    label: 'Gnome pour résister au contrôle ennemi',
    cible: (b) => b.roles.includes('controle') && b.sortsCles.length > 0,
    description: (nom) =>
      `Pour ${nom}, la race Gnome (n'importe quelle sous-race) donne l'avantage sur TOUS les jets de sauvegarde d'Intelligence, de Sagesse et de Charisme — c'est exactement ce qui protège un lanceur de sorts contre la plupart des effets de contrôle ennemis (Charme, Peur, Domination...).`,
  },
  {
    id: 'halfelin-jet-a-risque',
    race: 'Halfelin',
    label: 'Halfelin pour fiabiliser tes jets à risque',
    cible: (b) => donCorrespond(b, /Tireur d.élite|Grand Maître d.armes|Maître d.armes à deux mains/i),
    description: (nom) =>
      `${nom} mise sur des dons qui pénalisent volontairement le jet d'attaque (-5 pour +10 dégâts). La race Halfelin relance automatiquement tout 1 naturel sur un d20 (attaque, sauvegarde ou test) — exactement le genre de raté qui fait le plus mal sur ce profil — et Brave le rend immunisé à la Peur.`,
  },
  {
    id: 'githyanki-savoir-int',
    race: 'Githyanki',
    label: 'Githyanki pour un lanceur INT touche-à-tout',
    cible: (b) => b.classe === 'Magicien',
    description: (nom) =>
      `Pour ${nom}, la race Githyanki donne Connaissance astrale : en choisissant l'Intelligence, tu deviens maîtrisé dans TOUTES les compétences liées (Arcanes, Histoire, Investigation...), et tu peux changer ce choix à chaque repos long. Elle donne aussi Main du mage gratuitement, sans consommer un sort connu.`,
  },
  {
    id: 'drakeide-feu',
    race: 'Drakéide',
    label: 'Drakéide (ascendance rouge) pour un caster feu',
    cible: (b) => b.classe === 'Ensorceleur' && /feu/i.test(b.id),
    description: (nom) =>
      `Pour ${nom}, un Drakéide d'ascendance rouge apporte une résistance permanente aux dégâts de feu (utile contre tes propres zones et celles des ennemis) et un souffle de feu en zone, indépendant de tes sorts et emplacements.`,
  },
]

/** Le nom exact de la race que ce build préférerait, si une règle vérifiée s'applique — sinon undefined. */
export function conseilRacePourBuild(build: Build): ReglaConseilRace | undefined {
  return CONSEILS_RACE.find((r) => r.cible(build))
}

export interface CompagnonInfo {
  nom: string
  race: string
  sousRace?: string
  classeDefaut: string
  acte: string
}

/**
 * Les 10 compagnons recrutables de BG3, avec leur classe et leur race de départ (vérifiées bg3.wiki).
 * La race d'un compagnon ne peut PAS être changée par un reclassage chez Withers — seule sa classe le
 * peut. C'est ce qui rend certains rôles impossibles à obtenir autrement qu'en créant son propre
 * personnage (Tav).
 */
export const COMPAGNONS: CompagnonInfo[] = [
  { nom: 'Shadowheart', race: 'Demi-Elfe', classeDefaut: 'Clerc', acte: 'Acte 1, dès le début (plage du Nautiloïde échoué)' },
  { nom: 'Astarion', race: 'Elfe', sousRace: 'Haut-Elfe', classeDefaut: 'Roublard', acte: 'Acte 1, dès le début (plage du Nautiloïde échoué)' },
  { nom: 'Gale', race: 'Humain', classeDefaut: 'Magicien', acte: 'Acte 1, dès le début (cercle de sceaux près du Nautiloïde)' },
  { nom: 'Wyll', race: 'Humain', classeDefaut: 'Occultiste', acte: 'Acte 1, tôt (près de la Combe émeraude)' },
  { nom: 'Karlach', race: 'Tieffelin', classeDefaut: 'Barbare', acte: 'Acte 1, tôt (Route du Levant)' },
  { nom: "Lae'zel", race: 'Githyanki', classeDefaut: 'Guerrier', acte: 'Acte 1, prologue (la toute première rencontre possible)' },
  { nom: 'Halsin', race: 'Elfe', sousRace: 'Elfe des bois', classeDefaut: 'Druide', acte: 'Acte 1/2 (prisonnier du camp gobelin, rejoint activement en Acte 2)' },
  { nom: 'Jaheira', race: 'Demi-Elfe', classeDefaut: 'Druide', acte: 'Acte 2/3 (Tour de la Lune Montante)' },
  { nom: 'Minsc', race: 'Humain', classeDefaut: 'Rôdeur', acte: 'Acte 3 (nécessite Jaheira recrutée avant)' },
  { nom: 'Minthara', race: 'Drow', sousRace: 'Drow Loth-Sworn', classeDefaut: 'Paladin', acte: 'Acte 1 (camp gobelin, voie sombre) ou Acte 3 (voie rédemption)' },
]

/** Race dont l'app sait, via une règle vérifiée, qu'elle apporte un vrai bénéfice mécanique pour ce build. */
function beneficeRaceSpecifique(build: Build): string | null {
  return conseilRacePourBuild(build)?.race ?? null
}

function bucketDe(role: RoleTag): Bucket | null {
  switch (role) {
    case 'tank':
      return 'tank'
    case 'soin':
      return 'soin'
    case 'controle':
      return 'controle'
    case 'degatsMelee':
    case 'degatsDistance':
      return 'degats'
    default:
      return null
  }
}

function bucketsCouverts(build: Build): Bucket[] {
  return [...new Set(build.roles.map(bucketDe).filter((b): b is Bucket => b !== null))]
}

function ajusterProfil(genre: GenreGroupe, preferenceSoin: PreferenceSoin): Besoins {
  const besoins = { ...PROFILS[genre] }
  if (preferenceSoin === 'oui' && besoins.soin < 1) {
    besoins.soin = 1
    besoins.degats = Math.max(0, besoins.degats - 1)
  }
  if (preferenceSoin === 'non' && besoins.soin > 0) {
    besoins.degats += besoins.soin
    besoins.soin = 0
  }
  return besoins
}

function objetsPartages(a: Build, b: Build) {
  return a.equipement.filter((e) => b.equipement.some((e2) => e2.objetId === e.objetId))
}

function penaliteCannibalisation(candidat: Build, dejaChoisis: Build[]): number {
  let penalite = 0
  for (const autre of dejaChoisis) {
    for (const e of objetsPartages(candidat, autre)) {
      penalite += 8
      if (e.importance === 'Excellent' || e.importance === 'Essentiel') penalite += 8
    }
  }
  return penalite
}

function synergiesEntre(a: Build, b: Build): RegleSynergie[] {
  return REGLES_SYNERGIE.filter((r) => (r.aTag(a) && r.bTag(b)) || (r.aTag(b) && r.bTag(a)))
}

/**
 * Détecte toutes les synergies mécaniques entre les builds d'un groupe (chaque règle une seule fois,
 * même si plusieurs paires la déclenchent). Utilisée aussi bien par le builder que par la fiche de
 * groupe réelle — un seul moteur de vérité pour ces règles.
 */
export function detecterSynergies(groupe: Build[]): SynergieDetectee[] {
  const synergies: SynergieDetectee[] = []
  const reglesDejaAffichees = new Set<string>()
  for (let i = 0; i < groupe.length; i++) {
    for (let j = i + 1; j < groupe.length; j++) {
      for (const regle of synergiesEntre(groupe[i], groupe[j])) {
        if (reglesDejaAffichees.has(regle.id)) continue
        reglesDejaAffichees.add(regle.id)
        const [a, b] = regle.aTag(groupe[i]) ? [groupe[i], groupe[j]] : [groupe[j], groupe[i]]
        synergies.push({ label: regle.label, description: regle.description(a.nom, b.nom) })
      }
    }
  }
  return synergies
}

function bonusSynergie(candidat: Build, dejaChoisis: Build[], synergiesSurprenantes: boolean): number {
  let bonus = 0
  const poids = synergiesSurprenantes ? 26 : 16
  for (const autre of dejaChoisis) {
    bonus += synergiesEntre(candidat, autre).length * poids
  }
  return bonus
}

interface OptionsScore {
  besoins: Besoins
  dejaChoisis: Build[]
  genre: GenreGroupe
  styleCombat: StyleCombat
  multiclassage: PreferenceMulticlasse
  synergiesSurprenantes: boolean
}

/**
 * Rendements décroissants : le 1er besoin comblé par un candidat compte plein, les suivants de
 * moins en moins. Sans ça, un profil "touche-à-tout" qui comble 3 besoins à la fois écrase
 * mathématiquement tout spécialiste mono-rôle, et les mêmes classes généralistes reviennent sans
 * arrêt quel que soit le contexte — ce n'était pas un manque d'idées, c'est un biais du calcul.
 */
const POIDS_BESOIN_COMBLE = [25, 13, 7, 4]

function scoreCandidat(candidat: Build, o: OptionsScore): number {
  let score = 0
  const bucketsCandidat = bucketsCouverts(candidat)
  const bucketsBesoinCombles = bucketsCandidat.filter((b) => o.besoins[b] > 0)
  bucketsBesoinCombles.forEach((_, i) => {
    score += POIDS_BESOIN_COMBLE[Math.min(i, POIDS_BESOIN_COMBLE.length - 1)]
  })
  score += (bucketsCandidat.length - bucketsBesoinCombles.length) * 6
  if (candidat.roles.includes('utilitaire')) score += 4

  score -= penaliteCannibalisation(candidat, o.dejaChoisis)
  score += bonusSynergie(candidat, o.dejaChoisis, o.synergiesSurprenantes)

  if (o.styleCombat === 'melee' && (candidat.roles.includes('tank') || candidat.roles.includes('degatsMelee'))) {
    score += 10
  }
  if (
    o.styleCombat === 'distance' &&
    (candidat.roles.includes('degatsDistance') || candidat.roles.includes('controle') || candidat.roles.includes('soin'))
  ) {
    score += 10
  }

  const multi = estMulticlasse(candidat)
  if (o.multiclassage === 'multi' && multi) score += 12
  if (o.multiclassage === 'mono' && multi) score -= 12

  if (o.genre === 'atypique' || o.synergiesSurprenantes) {
    score += BUILDS_CLASSIQUES.has(candidat.id) ? -12 : 8
  }

  return score
}

function decrementerBesoins(besoins: Besoins, build: Build) {
  for (const bucket of bucketsCouverts(build)) {
    if (besoins[bucket] > 0) besoins[bucket] -= 1
  }
}

function raisonChoix(build: Build, besoinsAvant: Besoins, dejaChoisis: Build[]): string {
  const bucketsRepondus = bucketsCouverts(build).filter((b) => besoinsAvant[b] > 0)
  const partagesImportants = dejaChoisis.some((autre) =>
    objetsPartages(build, autre).some((e) => e.importance === 'Excellent' || e.importance === 'Essentiel'),
  )
  const nbSynergies = dejaChoisis.reduce((n, autre) => n + synergiesEntre(build, autre).length, 0)

  const morceaux: string[] = []
  if (bucketsRepondus.length > 0) {
    morceaux.push(`comble le rôle ${bucketsRepondus.map((b) => LABELS_BUCKET[b]).join(' + ')}`)
  } else {
    morceaux.push('apporte de la variété au groupe')
  }
  if (nbSynergies > 0) {
    morceaux.push(`synergise avec ${nbSynergies > 1 ? 'plusieurs membres' : 'un autre membre'} du groupe`)
  }
  morceaux.push(
    partagesImportants
      ? 'attention, se dispute un objet important avec un autre membre'
      : "pas d'objet important en commun avec le reste du groupe",
  )
  return morceaux.join(' · ')
}

/** Écart de score en dessous du meilleur : au-delà, un candidat n'est plus considéré "aussi bon". */
const ECART_QUASI_EX_AEQUO = 12

/**
 * Choisit parmi les meilleurs candidats plutôt que TOUJOURS le premier. Quand plusieurs profils
 * sont réellement comparables (score à moins de ECART_QUASI_EX_AEQUO points du meilleur), le choix
 * est pondéré par leur score au lieu d'être figé sur un seul gagnant — sinon la même poignée de
 * classes "optimales" revient sans arrêt, quelle que soit la nuance de la demande.
 */
function meilleurCandidat(candidats: Build[], o: OptionsScore): Build | null {
  if (candidats.length === 0) return null
  const notes = candidats
    .map((candidat) => ({ candidat, score: scoreCandidat(candidat, o) }))
    .sort((a, b) => b.score - a.score || a.candidat.id.localeCompare(b.candidat.id))

  const seuil = notes[0].score - ECART_QUASI_EX_AEQUO
  const finalistes = notes.filter((n) => n.score >= seuil)
  if (finalistes.length <= 1) return notes[0].candidat

  const poids = finalistes.map((n) => n.score - seuil + 1)
  const poidsTotal = poids.reduce((s, p) => s + p, 0)
  let tirage = Math.random() * poidsTotal
  for (let i = 0; i < finalistes.length; i++) {
    tirage -= poids[i]
    if (tirage <= 0) return finalistes[i].candidat
  }
  return finalistes[0].candidat
}

export interface CompagnonAssigne extends CompagnonInfo {
  reclassageNecessaire: boolean
}

export interface SlotPropose {
  build: Build
  raison: string
  /** true si ce personnage existait déjà avant la composition (fourni via builsFixes). */
  dejaExistant: boolean
  /** 'perso' = à créer toi-même (ou déjà existant) ; 'compagnon' = à recruter dans l'histoire. */
  typeSlot: 'perso' | 'compagnon'
  compagnon?: CompagnonAssigne
}

/**
 * Répartit les 4 rôles entre "à créer toi-même" et "compagnon à recruter", selon le nombre de joueurs
 * réels. En solo, un seul personnage peut être créé — les 3 autres emplacements sont forcément des
 * compagnons de l'histoire (classe reclassable chez Withers, mais race fixe et non modifiable).
 */
function assignerJoueursEtCompagnons(slots: SlotPropose[], nbJoueurs: number): void {
  const assignables = slots.filter((s) => !s.dejaExistant)
  const nbCompagnonsNecessaires = Math.max(0, assignables.length - nbJoueurs)

  if (nbCompagnonsNecessaires === 0) return

  const compagnonsDisponibles = [...COMPAGNONS]

  const priorises = assignables
    .map((slot) => {
      const raceUtile = beneficeRaceSpecifique(slot.build)
      const compagnonDeCetteRace = raceUtile
        ? compagnonsDisponibles.find((c) => c.race === raceUtile)
        : undefined
      const compagnonClasseExacte = compagnonsDisponibles.find((c) => c.classeDefaut === slot.build.classe)
      let poids = 0
      if (raceUtile && !compagnonDeCetteRace) poids = 100
      else if (!compagnonClasseExacte) poids = 50
      return { slot, poids }
    })
    .sort((a, b) => b.poids - a.poids)

  const slotsCompagnons = priorises.slice(0, nbCompagnonsNecessaires).map((p) => p.slot)

  for (const slot of slotsCompagnons) {
    slot.typeSlot = 'compagnon'
    const raceUtile = beneficeRaceSpecifique(slot.build)
    let index = raceUtile ? compagnonsDisponibles.findIndex((c) => c.race === raceUtile) : -1
    if (index < 0) index = compagnonsDisponibles.findIndex((c) => c.classeDefaut === slot.build.classe)
    const choisi =
      index >= 0
        ? compagnonsDisponibles.splice(index, 1)[0]
        : compagnonsDisponibles.splice(0, 1)[0]
    if (!choisi) continue
    slot.compagnon = { ...choisi, reclassageNecessaire: choisi.classeDefaut !== slot.build.classe }
  }

  if (nbJoueurs === 1) {
    const slotPerso = assignables.find((s) => s.typeSlot === 'perso')
    if (slotPerso) {
      const raceUtile = beneficeRaceSpecifique(slotPerso.build)
      const compagnonDeCetteRaceRestant = raceUtile
        ? compagnonsDisponibles.find((c) => c.race === raceUtile)
        : undefined
      const compagnonClasseExacteRestant = compagnonsDisponibles.find(
        (c) => c.classeDefaut === slotPerso.build.classe,
      )
      const raisonSolo =
        raceUtile && !compagnonDeCetteRaceRestant
          ? `C'est le personnage à créer toi-même : la race ${raceUtile} débloque un vrai avantage pour ce build, et aucun compagnon encore disponible n'est de cette race pour ce rôle — impossible d'obtenir cet avantage autrement qu'en le créant.`
          : !compagnonClasseExacteRestant
            ? `C'est le personnage à créer toi-même : aucun compagnon disponible ne joue naturellement ${slotPerso.build.classe} — tu évites d'avoir à reclasser quelqu'un en dehors de son identité pour ce rôle.`
            : `C'est le personnage à créer toi-même — les 3 autres rôles sont déjà bien couverts par des compagnons qui collent naturellement au profil recherché.`
      slotPerso.raison = `${slotPerso.raison} · ${raisonSolo}`
    }
  }
}

export interface SynergieDetectee {
  label: string
  description: string
}

export interface ConseilRace {
  label: string
  description: string
}

export interface ResultatComposition {
  genre: GenreGroupe
  slots: SlotPropose[]
  synergies: SynergieDetectee[]
  conseilsRace: ConseilRace[]
  avertissements: string[]
}

/** Un conseil de race par personnage concerné au maximum, pour ne pas noyer le résultat. */
export function genererConseilsRace(choisis: Build[]): ConseilRace[] {
  const conseils: ConseilRace[] = []
  const buildsDejaConseilles = new Set<string>()
  for (const regle of CONSEILS_RACE) {
    const cible = choisis.find((b) => regle.cible(b) && !buildsDejaConseilles.has(b.id))
    if (!cible) continue
    buildsDejaConseilles.add(cible.id)
    conseils.push({ label: regle.label, description: regle.description(cible.nom) })
  }
  return conseils
}

export interface OptionsComposition {
  /** Builds déjà fixés (par ex. des personnages existants), dans l'ordre des emplacements — optionnel. */
  builsFixes?: Build[]
  genre: GenreGroupe
  preferenceSoin: PreferenceSoin
  styleCombat: StyleCombat
  multiclassage: PreferenceMulticlasse
  /** Classes qu'on veut absolument voir dans le groupe, par ordre de priorité. */
  classesAInclure?: string[]
  /** Classes à ne surtout pas proposer. */
  classesAEviter?: string[]
  /** Pousse l'algorithme à privilégier des associations moins évidentes mais très synergiques. */
  synergiesSurprenantes?: boolean
  /** Nombre de joueurs réels (1 à 4) — détermine combien de rôles restent des compagnons à recruter. */
  nbJoueurs?: number
  tailleEquipe?: number
  /** Builds à ne jamais proposer (déjà montrés lors d'un remplacement ou d'une autre proposition). */
  buildsAExclure?: string[]
}

function calculerAvertissements(choisis: Build[], tailleEquipe: number): string[] {
  const avertissements: string[] = []
  const parObjet = new Map<string, Build[]>()
  for (const b of choisis) {
    for (const e of b.equipement) {
      const liste = parObjet.get(e.objetId) ?? []
      liste.push(b)
      parObjet.set(e.objetId, liste)
    }
  }
  for (const [objetId, liste] of parObjet) {
    if (liste.length < 2) continue
    const objet = getObjet(objetId)
    const nomObjet = objet ? nomAffiche(objet) : objetId
    avertissements.push(
      `${liste.map((b) => b.nom).join(' et ')} convoitent le même objet (${nomObjet}) — un des deux devra s'en passer ou choisir une alternative.`,
    )
  }
  if (choisis.length < tailleEquipe) {
    avertissements.push(
      `Je n'ai trouvé que ${choisis.length} classe(s) différente(s) sans doublon possible pour compléter les ${tailleEquipe} emplacements.`,
    )
  }
  return avertissements
}

/**
 * Propose une composition d'équipe complète et indépendante de tes personnages existants (sauf si tu
 * lui en fournis explicitement). Respecte les emplacements déjà fixés, évite les doublons de classe et
 * la cannibalisation d'objets, et cherche activement des synergies mécaniques entre les membres choisis.
 */
export function composerEquipe(options: OptionsComposition): ResultatComposition {
  const tailleEquipe = options.tailleEquipe ?? 4
  const classesAEviter = new Set(options.classesAEviter ?? [])
  const buildsAExclure = new Set(options.buildsAExclure ?? [])
  const synergiesSurprenantes = options.synergiesSurprenantes ?? false
  const besoins = ajusterProfil(options.genre, options.preferenceSoin)

  const choisis: Build[] = [...(options.builsFixes ?? [])]
  const slots: SlotPropose[] = choisis.map((build) => ({
    build,
    raison: 'Personnage déjà présent dans ton groupe',
    dejaExistant: true,
    typeSlot: 'perso',
  }))
  for (const build of choisis) decrementerBesoins(besoins, build)

  const classesUtilisees = new Set(choisis.map((b) => b.classe))

  const scoreOptions = (): OptionsScore => ({
    besoins,
    dejaChoisis: choisis,
    genre: options.genre,
    styleCombat: options.styleCombat,
    multiclassage: options.multiclassage,
    synergiesSurprenantes,
  })

  for (const classe of options.classesAInclure ?? []) {
    if (choisis.length >= tailleEquipe) break
    if (classesUtilisees.has(classe)) continue
    const candidats = builds.filter((b) => b.classe === classe && !buildsAExclure.has(b.id))
    const meilleur = meilleurCandidat(candidats, scoreOptions())
    if (!meilleur) continue

    const besoinsAvant = { ...besoins }
    choisis.push(meilleur)
    slots.push({
      build: meilleur,
      raison: raisonChoix(meilleur, besoinsAvant, choisis.slice(0, -1)),
      dejaExistant: false,
      typeSlot: 'perso',
    })
    decrementerBesoins(besoins, meilleur)
    classesUtilisees.add(meilleur.classe)
  }

  while (choisis.length < tailleEquipe) {
    const candidats = builds.filter(
      (b) => !classesUtilisees.has(b.classe) && !classesAEviter.has(b.classe) && !buildsAExclure.has(b.id),
    )
    const meilleur = meilleurCandidat(candidats, scoreOptions())
    if (!meilleur) break

    const besoinsAvant = { ...besoins }
    choisis.push(meilleur)
    slots.push({
      build: meilleur,
      raison: raisonChoix(meilleur, besoinsAvant, choisis.slice(0, -1)),
      dejaExistant: false,
      typeSlot: 'perso',
    })
    decrementerBesoins(besoins, meilleur)
    classesUtilisees.add(meilleur.classe)
  }

  const synergies = detecterSynergies(choisis)
  const avertissements = calculerAvertissements(choisis, tailleEquipe)

  assignerJoueursEtCompagnons(slots, options.nbJoueurs ?? tailleEquipe)

  return { genre: options.genre, slots, synergies, conseilsRace: genererConseilsRace(choisis), avertissements }
}

/**
 * Remplace UN emplacement d'une composition déjà générée par le meilleur complément suivant, en
 * gardant tous les autres emplacements strictement intacts (raison, compagnon assigné, etc.) — pas
 * de rebrassage global pour un seul remplacement. Ne touche jamais un emplacement déjà existant
 * (`dejaExistant`) : ce ne sont pas des propositions, ce sont de vrais personnages du groupe.
 */
export function remplacerSlot(
  resultatActuel: ResultatComposition,
  indexARemplacer: number,
  options: OptionsComposition,
): ResultatComposition {
  const slotActuel = resultatActuel.slots[indexARemplacer]
  if (!slotActuel || slotActuel.dejaExistant) return resultatActuel

  const autresSlots = resultatActuel.slots.filter((_, i) => i !== indexARemplacer)
  const autresBuilds = autresSlots.map((s) => s.build)
  const classesUtilisees = new Set(autresBuilds.map((b) => b.classe))
  const classesAEviter = new Set(options.classesAEviter ?? [])
  const buildsAExclure = new Set([slotActuel.build.id, ...(options.buildsAExclure ?? [])])
  const synergiesSurprenantes = options.synergiesSurprenantes ?? false

  const besoins = ajusterProfil(options.genre, options.preferenceSoin)
  for (const b of autresBuilds) decrementerBesoins(besoins, b)

  const candidats = builds.filter(
    (b) => !classesUtilisees.has(b.classe) && !classesAEviter.has(b.classe) && !buildsAExclure.has(b.id),
  )
  const meilleur = meilleurCandidat(candidats, {
    besoins,
    dejaChoisis: autresBuilds,
    genre: options.genre,
    styleCombat: options.styleCombat,
    multiclassage: options.multiclassage,
    synergiesSurprenantes,
  })
  if (!meilleur) return resultatActuel

  const nouveauSlot: SlotPropose = {
    build: meilleur,
    raison: raisonChoix(meilleur, besoins, autresBuilds),
    dejaExistant: false,
    typeSlot: slotActuel.typeSlot,
  }

  // Si l'emplacement remplacé était tenu par un compagnon, on cherche un compagnon compatible avec
  // le nouveau build parmi ceux pas déjà utilisés ailleurs dans la composition (jamais le même
  // compagnon recruté deux fois).
  if (slotActuel.typeSlot === 'compagnon') {
    const compagnonsUtilises = new Set(
      autresSlots.filter((s) => s.compagnon).map((s) => s.compagnon!.nom),
    )
    const disponibles = COMPAGNONS.filter((c) => !compagnonsUtilises.has(c.nom))
    const raceUtile = beneficeRaceSpecifique(meilleur)
    const compagnonRaceUtile = raceUtile ? disponibles.find((c) => c.race === raceUtile) : undefined
    const compagnonClasseExacte = disponibles.find((c) => c.classeDefaut === meilleur.classe)
    const choisi = compagnonRaceUtile ?? compagnonClasseExacte ?? disponibles[0]
    if (choisi) {
      nouveauSlot.compagnon = { ...choisi, reclassageNecessaire: choisi.classeDefaut !== meilleur.classe }
    } else {
      // Plus aucun compagnon disponible (cas limite) : retombe sur "ton perso" plutôt que planter.
      nouveauSlot.typeSlot = 'perso'
    }
  }

  const nouveauxSlots = resultatActuel.slots.map((s, i) => (i === indexARemplacer ? nouveauSlot : s))
  const nouveauxBuilds = nouveauxSlots.map((s) => s.build)

  return {
    genre: resultatActuel.genre,
    slots: nouveauxSlots,
    synergies: detecterSynergies(nouveauxBuilds),
    conseilsRace: genererConseilsRace(nouveauxBuilds),
    avertissements: calculerAvertissements(nouveauxBuilds, options.tailleEquipe ?? nouveauxSlots.length),
  }
}

/**
 * Génère une autre composition complète avec les mêmes réponses, en excluant tous les builds
 * (non déjà-existants) déjà montrés — pour varier sans revenir à des choix déjà refusés.
 */
export function reproposerEquipe(
  resultatActuel: ResultatComposition,
  options: OptionsComposition,
): ResultatComposition {
  const idsAExclure = resultatActuel.slots.filter((s) => !s.dejaExistant).map((s) => s.build.id)
  return composerEquipe({ ...options, buildsAExclure: [...(options.buildsAExclure ?? []), ...idsAExclure] })
}

export const LABELS_GENRE_GROUPE = LABELS_GENRE
