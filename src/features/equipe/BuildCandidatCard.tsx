import type { Build } from '../../data'
import { estMulticlasse } from '../../data'
import { MulticlasseBadge } from '../../components/MulticlasseBadge'
import { ClasseIcon } from '../../components/ClasseIcon'

export function BuildCandidatCard({
  build,
  selectionne,
  onSelect,
}: {
  build: Build
  selectionne: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border p-3 text-left transition-colors ${
        selectionne ? 'border-glow/70 bg-glow/10' : 'border-border bg-surface-raised'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold-soft/50 bg-gold/10 text-gold">
            <ClasseIcon classe={build.classe} className="h-3.5 w-3.5" />
          </span>
          <p className="truncate text-sm font-semibold text-ink">{build.nom}</p>
        </div>
        <MulticlasseBadge multiclasse={estMulticlasse(build)} />
      </div>
      <p className="mt-0.5 text-xs text-gold">{build.role}</p>
      <p className="mt-1.5 text-xs text-ink-muted">{build.resume}</p>

      <div className="mt-2 grid grid-cols-1 gap-1">
        {build.forces.slice(0, 3).map((f) => (
          <p key={f} className="flex gap-1.5 text-xs text-ink">
            <span className="text-bon">+</span>
            {f}
          </p>
        ))}
        {build.faiblesses.slice(0, 2).map((f) => (
          <p key={f} className="flex gap-1.5 text-xs text-ink">
            <span className="text-essentiel">−</span>
            {f}
          </p>
        ))}
      </div>

      {build.synergies && build.synergies.length > 0 && (
        <div className="mt-2 border-t border-border pt-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            Synergies
          </p>
          {build.synergies.slice(0, 2).map((s) => (
            <p key={s} className="mt-1 text-xs text-ink-muted">
              {s}
            </p>
          ))}
        </div>
      )}
    </button>
  )
}
