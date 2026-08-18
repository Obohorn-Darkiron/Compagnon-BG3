import type { Build } from '../../data'
import { BONUS_PERMANENTS, labelsCarac, tousLesDonsParStat, type CleCarac } from '../../data/permanents'
import type { Personnage } from '../../storage/useSaveData'

export function bonusParStatObtenus(personnage: Personnage): Partial<Record<CleCarac, number>> {
  const bonus: Partial<Record<CleCarac, number>> = {}
  for (const b of BONUS_PERMANENTS) {
    if (!personnage.objetsObtenus.includes(b.objetId)) continue
    const choix = personnage.choixBonusPermanents[b.objetId]
    const stat = b.statFixe ?? (choix?.stat as CleCarac | undefined) ?? null
    if (!stat) continue
    const valeur = b.valeursPossibles.length > 1 ? (choix?.valeur ?? b.valeursPossibles[0]) : b.valeursPossibles[0]
    bonus[stat] = (bonus[stat] ?? 0) + valeur
  }
  return bonus
}

export interface PlanCarac {
  stat: CleCarac
  depart: number
  totalASI: number
  bonusPermanent: number
  cible: number
  pointsRestants: number
  /** Niveaux dont le don devient entièrement libre (feat au choix). */
  niveauxLibres: number[]
  /** Niveau où il reste exactement 1 point à placer : un demi-don (Résilient) referme la boucle. */
  niveauDemiDon: number | null
}

/** Recalcule, pour chaque caractéristique où un bonus permanent a été obtenu, tout ce que ça libère comme dons. */
export function calculerPlansCarac(build: Build, bonusParStat: Partial<Record<CleCarac, number>>): PlanCarac[] {
  const plans: PlanCarac[] = []
  for (const [stat, dons] of tousLesDonsParStat(build)) {
    const bonusPermanent = bonusParStat[stat] ?? 0
    if (bonusPermanent <= 0) continue
    const depart = build.caracDepart[stat]
    const totalASI = dons.length * 2
    const cible = depart + totalASI
    const pointsRestants = Math.max(0, cible - depart - bonusPermanent)
    const surplus = totalASI - pointsRestants
    if (surplus <= 0) continue

    const niveaux = dons.map((d) => d.niveau as number)
    const ordreLiberation = [...niveaux].reverse() // on libère les paliers les plus tardifs en premier
    const slotsLibres = Math.floor(surplus / 2)
    const unPointLibre = surplus % 2 === 1

    plans.push({
      stat,
      depart,
      totalASI,
      bonusPermanent,
      cible,
      pointsRestants,
      niveauxLibres: ordreLiberation.slice(0, slotsLibres),
      niveauDemiDon: unPointLibre ? (ordreLiberation[slotsLibres] ?? null) : null,
    })
  }
  return plans
}

const SUGGESTIONS_DON: { texte: string; motCles: RegExp }[] = [
  { texte: 'Guerrier de guerre (War Caster) — avantage aux sauvegardes de Concentration', motCles: /Guerrier de guerre/ },
  { texte: 'Vigilant (Alert) — +5 initiative, ne peut être surpris', motCles: /Vigilant/ },
  { texte: 'Robuste (Tough) — plus de points de vie', motCles: /Robuste/ },
  { texte: 'Chanceux (Lucky) — relance des jets ratés', motCles: /Chanceux/ },
]

function suggestionDon(build: Build): string {
  const texteDons = build.dons.join(' ')
  const estCaster = build.sortsCles.length > 0
  const ordre = estCaster
    ? SUGGESTIONS_DON
    : [SUGGESTIONS_DON[1], SUGGESTIONS_DON[2], SUGGESTIONS_DON[3], SUGGESTIONS_DON[0]]
  return (ordre.find((s) => !s.motCles.test(texteDons)) ?? ordre[0]).texte
}

/** Message pour le niveau actuellement affiché, dérivé du plan complet ci-dessus. */
export function noteBonusPermanent(
  build: Build,
  bonusParStat: Partial<Record<CleCarac, number>>,
  niveauActuel: number,
): string | null {
  for (const plan of calculerPlansCarac(build, bonusParStat)) {
    const nom = labelsCarac[plan.stat]

    // D'abord les correspondances exactes au niveau actuel (les plus actionnables), tous types confondus.
    if (plan.niveauDemiDon === niveauActuel) {
      return `Avec tes bonus permanents (+${plan.bonusPermanent} ${nom}), il ne te manque plus qu'1 point de ${nom} pour atteindre ${plan.cible}. Le plus efficace ici : Résilient (${nom}) — il comble ce dernier point et te donne en prime la maîtrise des jets de sauvegarde de ${nom}, au lieu de "gâcher" une augmentation complète.`
    }
    for (const niveauLibre of plan.niveauxLibres) {
      if (niveauLibre === niveauActuel) {
        return `Avec tes bonus permanents (+${plan.bonusPermanent} ${nom}), ce palier n'a plus besoin d'augmenter ${nom} — il est entièrement libre. Prends plutôt : ${suggestionDon(build)}.`
      }
    }

    // Sinon, avertissements rétrospectifs sur un palier déjà dépassé.
    if (plan.niveauDemiDon !== null && plan.niveauDemiDon < niveauActuel) {
      return `Tu es déjà niveau ${niveauActuel} : au niveau ${plan.niveauDemiDon}, tes bonus permanents (+${plan.bonusPermanent} ${nom}) ne laissaient plus besoin que d'1 point de ${nom}. Si tu as pris l'augmentation complète à la place, ce point est perdu — un respec chez Withers permettrait de reprendre Résilient (${nom}) à la place.`
    }
    for (const niveauLibre of plan.niveauxLibres) {
      if (niveauLibre < niveauActuel) {
        return `Tu es déjà niveau ${niveauActuel} : le palier ${niveauLibre} n'avait plus besoin d'augmenter ${nom} grâce à tes bonus permanents. Si tu l'as quand même mis dans ${nom}, ce n'est pas perdu (ça ne dépasse pas 20 pour rien), mais tu aurais pu prendre un don à la place — à corriger via un respec si tu veux optimiser.`
      }
    }
  }
  return null
}
