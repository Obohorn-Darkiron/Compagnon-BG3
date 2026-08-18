import { Link } from 'react-router-dom'
import type { Build } from '../../data/types'
import { estMulticlasse } from '../../data'
import { MulticlasseBadge } from '../../components/MulticlasseBadge'

export function BuildCard({ build }: { build: Build }) {
  return (
    <Link
      to={`/builds/${build.id}`}
      className="block rounded-xl border border-border bg-surface p-4 active:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gold">
            {build.classe} · {build.sousClasse}
          </p>
          <h3 className="mt-0.5 font-title text-lg font-semibold text-ink">{build.nom}</h3>
        </div>
        <MulticlasseBadge multiclasse={estMulticlasse(build)} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">{build.role}</p>
      <p className="mt-2 line-clamp-2 text-sm text-ink-muted/90">{build.resume}</p>
    </Link>
  )
}
