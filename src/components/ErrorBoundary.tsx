import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  aPlante: boolean
}

/** Filet de sécurité global : sans ça, une erreur de rendu imprévue N'IMPORTE OÙ dans l'appli
 * donne un écran blanc total, sans message ni moyen de s'en sortir pour quelqu'un de non-technique. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { aPlante: false }

  static getDerivedStateFromError(): State {
    return { aPlante: true }
  }

  componentDidCatch(erreur: unknown) {
    console.error('Erreur inattendue :', erreur)
  }

  render() {
    if (!this.state.aPlante) return this.props.children

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
            onClick={() => this.setState({ aPlante: false })}
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
        </div>
      </div>
    )
  }
}
