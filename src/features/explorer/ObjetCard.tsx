import { Link } from 'react-router-dom'
import type { Objet } from '../../data/types'
import { nomAffiche } from '../../data'
import { AlignementBadge } from '../../components/AlignementBadge'

export function ObjetCard({ objet }: { objet: Objet }) {
  return (
    <Link
      to={`/explorer/${objet.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 active:bg-surface-raised"
    >
      <div className="min-w-0">
        <p className="truncate font-title text-base font-semibold text-ink">
          {nomAffiche(objet)}
        </p>
        <p className="text-sm text-ink-muted">{objet.type}</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          Acte {objet.acte} · {objet.rarete}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <AlignementBadge alignement={objet.alignement} />
        {!objet.verifie && (
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-muted">
            à confirmer
          </span>
        )}
      </div>
    </Link>
  )
}
