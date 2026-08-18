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
    description: '+1 Charisme — le résultat le plus courant.',
  },
  {
    objetId: 'miroir-egarement-rare',
    label: "Miroir de l'égarement — bonus rare",
    statFixe: null,
    valeursPossibles: [2],
    description:
      '+2 sur la caractéristique de ton choix — rare (nécessite un jet de Religion DD 25 au préalable). Se cumule avec la Mémoire du Patriarche si obtenue sur une autre caractéristique : coche les deux si tu as eu cette chance.',
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
