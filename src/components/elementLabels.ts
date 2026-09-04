import type { ElementTag, MecaniqueTag } from '../data/types'

export const LABELS_ELEMENT: Record<ElementTag, string> = {
  feu: 'Feu',
  glace: 'Glace',
  foudre: 'Foudre',
  poison: 'Poison',
  acide: 'Acide',
  necrotique: 'Nécrotique',
  radiant: 'Radiant',
  tonnerre: 'Tonnerre',
  psychique: 'Psychique',
}

export const LABELS_MECANIQUE: Record<MecaniqueTag, string> = {
  critique: 'Critique',
}

/**
 * Explication vérifiée pour un élément qui a peu (ou pas) de builds dédiés dans le catalogue —
 * affichée à la place d'une liste vide silencieuse, pour dire POURQUOI plutôt que de laisser
 * croire à un trou de contenu. Seuls les éléments vraiment vérifiés ont une entrée ici ; les
 * autres cas de résultats maigres se contentent d'une note générique dans l'UI appelante.
 */
export const NOTE_ELEMENT_FAIBLE: Partial<Record<ElementTag, string>> = {
  acide:
    "L'acide est l'un des dégâts les plus faibles de BG3 : aucun sort exclusif fort (juste Orbe chromatique, qui choisit l'élément à la volée), et beaucoup d'ennemis y résistent ou y sont immunisés. Pas de build dédié possible de façon honnête — mais Orbe chromatique en fait une option ponctuelle sur le build ci-dessous.",
}
