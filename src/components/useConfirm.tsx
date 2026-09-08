import { useCallback, useState } from 'react'

interface EtatConfirmation {
  message: string
  danger: boolean
  confirmerLabel: string
  annulerLabel: string
  resolve: (valeur: boolean) => void
}

interface OptionsConfirm {
  danger?: boolean
  confirmerLabel?: string
  annulerLabel?: string
}

/** Remplace window.confirm() par une boîte de dialogue dans le style de l'appli — le navigateur
 * préfixe confirm() avec le nom de domaine ("obohorn-darkiron.github.io dit"), ce qui n'a rien à
 * faire dans une appli. Usage : const { confirmer, dialogue } = useConfirm(); ... if (await
 * confirmer('Supprimer ?')) { ... } puis rendre {dialogue} une fois dans le JSX du composant. */
export function useConfirm() {
  const [etat, setEtat] = useState<EtatConfirmation | null>(null)

  const confirmer = useCallback((message: string, options: OptionsConfirm = {}) => {
    return new Promise<boolean>((resolve) => {
      setEtat({
        message,
        danger: options.danger ?? false,
        confirmerLabel: options.confirmerLabel ?? 'Confirmer',
        annulerLabel: options.annulerLabel ?? 'Annuler',
        resolve,
      })
    })
  }, [])

  function repondre(valeur: boolean) {
    etat?.resolve(valeur)
    setEtat(null)
  }

  const dialogue = etat && (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => repondre(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-4 shadow-xl"
      >
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{etat.message}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => repondre(false)}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm text-ink-muted active:bg-surface-raised"
          >
            {etat.annulerLabel}
          </button>
          <button
            type="button"
            onClick={() => repondre(true)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium ${
              etat.danger ? 'bg-essentiel text-white' : 'bg-gold text-bg'
            }`}
          >
            {etat.confirmerLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return { confirmer, dialogue }
}
