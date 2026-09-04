import type { Build, CaracDepart } from './types'

export type CleCarac = keyof CaracDepart

export interface BonusPermanent {
  objetId: string
  label: string
  /** null = la caractéristique est choisie par le joueur. */
  statFixe: CleCarac | null
  /** Valeurs possibles ; s'il y en a plusieurs, le joueur choisit laquelle il a obtenue. */
  valeursPossibles: number[]
  description: string
  /** Note affichée à part, en évidence — pour un choix qui a une vraie implication morale/narrative. */
  avertissement?: string
}

export const BONUS_PERMANENTS: BonusPermanent[] = [
  {
    objetId: 'cheveux-tatie-ethel',
    label: 'Cheveux de Tatie Ethel',
    statFixe: null,
    valeursPossibles: [1],
    description: '+1 à la caractéristique de ton choix',
  },
  {
    objetId: 'miroir-egarement',
    label: "Miroir de l'égarement — Mémoire du Patriarche",
    statFixe: 'CHA',
    valeursPossibles: [1],
    description:
      "+1 Charisme. Uniquement au Cloître de la Douce Étreinte (Acte 3) — le Miroir trouvé dans le Gantelet de Shar en Acte 2 est fissuré et inutilisable. En sacrifiant un souvenir sans prier, ce résultat sort environ 1 fois sur 5 ; les autres souvenirs sacrifiés ne donnent rien. Impose Vigueur volée (-2 à la caractéristique choisie) jusqu'au prochain repos long — retirable avec Suppression de malédiction ou Restauration supérieure.",
  },
  {
    objetId: 'miroir-egarement-rare',
    label: "Miroir de l'égarement — bonus rare (prière)",
    statFixe: null,
    valeursPossibles: [2],
    description:
      "+2 sur la caractéristique de ton choix. Nécessite de prier le Miroir (en plus du sacrifice d'un souvenir) et de réussir un jet de Religion DD 25 — environ 60% de réussite si le jet passe, quasi impossible sinon. Impose aussi Vigueur volée (-2, jusqu'au prochain repos long, retirable). Se cumule avec la Mémoire du Patriarche si obtenue sur une autre caractéristique.",
    avertissement:
      "Prier le Miroir est un rituel explicitement dédié à Shar — un choix qui a du sens pour une run sombre ou grise, pas pour une run bienveillante stricte.",
  },
  {
    objetId: 'miroir-egarement-savoir-interdit',
    label: "Miroir de l'égarement — Savoir interdit",
    statFixe: null,
    valeursPossibles: [2],
    description:
      "+2 garanti sur la caractéristique de ton choix, sans jet de Religion — en sacrifiant spécifiquement le souvenir « Savoir interdit » obtenu pendant la quête de la Nécromancie de Thay (Gale). Impose quand même Vigueur volée (-2, jusqu'au prochain repos long, retirable).",
    avertissement:
      "Comme les autres bonus obtenus par le Miroir, ce sacrifice fait partie du même rituel dédié à Shar.",
  },
  {
    objetId: 'potion-hautelune-force',
    label: 'Potion de Hautelune',
    statFixe: 'FOR',
    valeursPossibles: [2],
    description: '+2 Force',
  },
]

const nomVersStat: Record<string, CleCarac> = {
  force: 'FOR',
  dexterite: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  sagesse: 'SAG',
  charisme: 'CHA',
}

function sansAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export interface DonInfo {
  texte: string
  niveau: number | null
  stat: CleCarac | null
}

/** Analyse le texte des dons d'un build pour retrouver, quand c'est possible, la caractéristique et le niveau visés. */
export function informationsDons(build: Build): DonInfo[] {
  return build.dons.map((texte) => {
    const statMatch = texte.match(/\+2 (Force|Dext[ée]rit[ée]|Constitution|Intelligence|Sagesse|Charisme)/i)
    const niveauMatch = texte.match(/niv\.?\s*(\d+)/i)
    return {
      texte,
      niveau: niveauMatch ? Number(niveauMatch[1]) : null,
      stat: statMatch ? (nomVersStat[sansAccents(statMatch[1])] ?? null) : null,
    }
  })
}

/** Pour une même caractéristique, ne garde que le don d'augmentation le plus tardif (celui qui devient superflu en premier). */
export function dernierDonParStat(build: Build): Map<CleCarac, DonInfo> {
  const dernier = new Map<CleCarac, DonInfo>()
  for (const info of informationsDons(build)) {
    if (!info.stat || info.niveau === null) continue
    const existant = dernier.get(info.stat)
    if (!existant || (existant.niveau ?? 0) < info.niveau) {
      dernier.set(info.stat, info)
    }
  }
  return dernier
}

/** Toutes les augmentations de caractéristique programmées pour ce build, groupées par caractéristique (triées par niveau). */
export function tousLesDonsParStat(build: Build): Map<CleCarac, DonInfo[]> {
  const parStat = new Map<CleCarac, DonInfo[]>()
  for (const info of informationsDons(build)) {
    if (!info.stat || info.niveau === null) continue
    const liste = parStat.get(info.stat) ?? []
    liste.push(info)
    parStat.set(info.stat, liste)
  }
  for (const liste of parStat.values()) liste.sort((a, b) => (a.niveau ?? 0) - (b.niveau ?? 0))
  return parStat
}

/** Si un don propose "X ou +2 Carac", renvoie "X" (l'alternative non liée à la caractéristique). */
export function alternativeNonStat(texte: string): string | null {
  const parties = texte.split(/\s+ou\s+/i)
  if (parties.length < 2) return null
  const autre = parties.find((p) => !/\+2 (Force|Dext[ée]rit[ée]|Constitution|Intelligence|Sagesse|Charisme)/i.test(p))
  if (!autre) return null
  return autre.replace(/\s*\(niv\.?\s*\d+\)\s*/i, '').trim()
}

export const labelsCarac: Record<CleCarac, string> = {
  FOR: 'Force',
  DEX: 'Dextérité',
  CON: 'Constitution',
  INT: 'Intelligence',
  SAG: 'Sagesse',
  CHA: 'Charisme',
}
