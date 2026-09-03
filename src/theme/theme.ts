import { useSyncExternalStore } from 'react'

export type ThemeId = 'sombre' | 'parchemin'

export interface ThemeInfo {
  id: ThemeId
  label: string
  /** Fond et couleur d'accent du thème, pour le carré diagonal du sélecteur — pas d'usage CSS réel. */
  couleurFond: string
  couleurAccent: string
}

export const THEMES: ThemeInfo[] = [
  { id: 'sombre', label: 'Sombre', couleurFond: '#0a0d1f', couleurAccent: '#a855f7' },
  { id: 'parchemin', label: 'Parchemin', couleurFond: '#f2ead9', couleurAccent: '#b3261e' },
]

const CLE_STOCKAGE = 'bg3-companion-theme'
const abonnes = new Set<() => void>()

function themeValide(valeur: string | null): ThemeId {
  return valeur === 'parchemin' ? 'parchemin' : 'sombre'
}

function lireStockage(): ThemeId {
  try {
    return themeValide(localStorage.getItem(CLE_STOCKAGE))
  } catch {
    return 'sombre'
  }
}

let themeActuel: ThemeId = lireStockage()

function appliquerAuDocument(theme: ThemeId) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

/** À appeler une fois, au démarrage de l'appli, avant le premier rendu — évite un flash du mauvais thème. */
export function initialiserTheme() {
  appliquerAuDocument(themeActuel)
}

export function lireTheme(): ThemeId {
  return themeActuel
}

export function definirTheme(theme: ThemeId) {
  themeActuel = theme
  try {
    localStorage.setItem(CLE_STOCKAGE, theme)
  } catch {
    // Stockage indisponible (navigation privée, quota plein) — le thème reste actif pour la session en cours.
  }
  appliquerAuDocument(theme)
  abonnes.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  abonnes.add(fn)
  return () => abonnes.delete(fn)
}

/** Lit le thème courant et se met à jour automatiquement si `definirTheme` est appelé ailleurs. */
export function useTheme(): ThemeId {
  return useSyncExternalStore(subscribe, lireTheme)
}
