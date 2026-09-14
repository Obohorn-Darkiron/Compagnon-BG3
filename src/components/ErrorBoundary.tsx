import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  erreur: Error | null
  pileComposants: string | null
  detailsOuverts: boolean
  copie: boolean
}

const CLE_DERNIERE_ERREUR = 'bg3-companion-derniere-erreur'

/** Filet de sécurité global : sans ça, une erreur de rendu imprévue N'IMPORTE OÙ dans l'appli
 * donne un écran blanc total, sans message ni moyen de s'en sortir pour quelqu'un de non-technique.
 *
 * Capture aussi le détail technique (message, pile d'appel, pile de composants) et le garde en
 * mémoire ET dans le stockage local — avant, seul un console.error partait, invisible pour
 * quelqu'un qui teste sur téléphone sans outils de dev branchés. Avec ça, la personne peut copier
 * l'erreur réelle et me la transmettre au lieu de juste décrire "un écran cassé". */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { erreur: null, pileComposants: null, detailsOuverts: false, copie: false }

  static getDerivedStateFromError(erreur: unknown): Partial<State> {
    return { erreur: erreur instanceof Error ? erreur : new Error(String(erreur)) }
  }

  componentDidCatch(erreur: unknown, info: { componentStack?: string | null }) {
    console.error('Erreur inattendue :', erreur, info.componentStack)
    this.setState({ pileComposants: info.componentStack ?? null })
    try {
      const texte = this.texteErreur(
        erreur instanceof Error ? erreur : new Error(String(erreur)),
        info.componentStack ?? null,
      )
      window.localStorage.setItem(CLE_DERNIERE_ERREUR, texte)
    } catch {
      // stockage indisponible : tant pis, les détails restent affichables depuis l'écran actuel
    }
  }

  texteErreur(erreur: Error, pileComposants: string | null): string {
    return [
      `Date : ${new Date().toISOString()}`,
      `Page : ${window.location.hash || window.location.pathname}`,
      `Message : ${erreur.message}`,
      erreur.stack ? `Pile :\n${erreur.stack}` : null,
      pileComposants ? `Composants :\n${pileComposants}` : null,
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  async copierDetails() {
    const { erreur, pileComposants } = this.state
    if (!erreur) return
    try {
      await navigator.clipboard.writeText(this.texteErreur(erreur, pileComposants))
      this.setState({ copie: true })
      setTimeout(() => this.setState({ copie: false }), 1500)
    } catch {
      // presse-papiers indisponible : le texte reste visible et sélectionnable à la main
    }
  }

  render() {
    if (!this.state.erreur) return this.props.children

    return (
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-4xl">⚠️</p>
        <div>
          <p className="text-base font-semibold text-ink">Un souci est survenu sur cet écran</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            Tes données ne sont pas perdues. Essaie de recharger — si ça se reproduit, exporte ta
            sauvegarde depuis Paramètres par précaution.
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <button
            type="button"
            onClick={() => this.setState({ erreur: null, pileComposants: null })}
            className="w-full rounded-lg border border-glow/60 bg-glow/10 py-2.5 text-sm font-medium text-glow"
          >
            Réessayer
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-lg border border-border py-2.5 text-sm text-ink-muted"
          >
            Recharger l'appli
          </button>
          <button
            type="button"
            onClick={() => this.setState({ detailsOuverts: !this.state.detailsOuverts })}
            className="w-full py-1.5 text-xs text-ink-muted underline underline-offset-2"
          >
            {this.state.detailsOuverts ? 'Masquer les détails techniques' : 'Voir les détails techniques'}
          </button>
        </div>
        {this.state.detailsOuverts && (
          <div className="w-full max-w-xs rounded-lg border border-border bg-surface p-3 text-left">
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-snug text-ink-muted">
              {this.texteErreur(this.state.erreur, this.state.pileComposants)}
            </pre>
            <button
              type="button"
              onClick={() => this.copierDetails()}
              className="mt-2 w-full rounded-lg border border-border py-2 text-xs font-medium text-ink"
            >
              {this.state.copie ? 'Copié !' : 'Copier les détails techniques'}
            </button>
          </div>
        )}
      </div>
    )
  }
}
