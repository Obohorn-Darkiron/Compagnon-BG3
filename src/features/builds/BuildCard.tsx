import { Link } from 'react-router-dom'
import type { Build } from '../../data/types'
import { estMulticlasse } from '../../data'
import { MulticlasseBadge } from '../../components/MulticlasseBadge'
import { ClasseIcon } from '../../components/ClasseIcon'
import { ElementBadge } from '../../components/ElementBadge'
import { Check } from '../../components/icons'

export function BuildCard({
  build,
  modeComparaison = false,
  selectionne = false,
  onToggleSelection,
}: {
  build: Build
  modeComparaison?: boolean
  selectionne?: boolean
  onToggleSelection?: () => void
}) {
  const contenu = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-soft/50 bg-gold/10 text-gold">
            <ClasseIcon classe={build.classe} className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gold">
              {build.classe} · {build.sousClasse}
            </p>
            <h3 className="mt-0.5 font-title text-lg font-semibold text-ink">{build.nom}</h3>
          </div>
        </div>
        {modeComparaison ? (
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
              selectionne ? 'border-glow bg-glow text-bg' : 'border-border text-transparent'
            }`}
          >
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : (
          <MulticlasseBadge multiclasse={estMulticlasse(build)} />
        )}
      </div>
      <p className="mt-1 text-sm text-ink-muted">{build.role}</p>
      {build.elements.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {build.elements.map((e) => (
            <ElementBadge key={e} element={e} />
          ))}
        </div>
      )}
      <p className="mt-2 line-clamp-2 text-sm text-ink-muted/90">{build.resume}</p>
    </>
  )

  if (modeComparaison) {
    return (
      <button
        type="button"
        onClick={onToggleSelection}
        className={`block w-full rounded-xl border p-4 text-left active:bg-surface-raised ${
          selectionne ? 'border-glow/70 bg-glow/10' : 'border-border bg-surface'
        }`}
      >
        {contenu}
      </button>
    )
  }

  return (
    <Link
      to={`/builds/${build.id}`}
      className="block rounded-xl border border-border bg-surface p-4 active:bg-surface-raised"
    >
      {contenu}
    </Link>
  )
}
