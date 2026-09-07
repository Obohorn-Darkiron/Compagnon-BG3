import type { ChoixSort } from '../data/types'

const LABELS_TYPE_SORT: Record<ChoixSort['type'], string> = {
  nouveau: 'Nouveau',
  toujoursPrepare: 'Toujours préparé',
  echange: 'Échange',
}

const STYLES_TYPE_SORT: Record<ChoixSort['type'], string> = {
  nouveau: 'bg-bon/20 text-bon border-bon/40',
  toujoursPrepare: 'bg-situationnel/20 text-situationnel border-situationnel/40',
  echange: 'bg-glow/20 text-glow border-glow/40',
}

export function ChoixSortBadge({ sort }: { sort: ChoixSort }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STYLES_TYPE_SORT[sort.type]}`}
      >
        {LABELS_TYPE_SORT[sort.type]}
      </span>
      <span className="text-sm font-bold text-ink">{sort.nom}</span>
      {sort.note && <span className="text-xs text-ink-muted">— {sort.note}</span>}
    </div>
  )
}
