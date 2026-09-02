import type { ElementTag } from '../data/types'
import { LABELS_ELEMENT } from './elementLabels'

export function ElementBadge({ element }: { element: ElementTag }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs text-ink-muted">
      {LABELS_ELEMENT[element]}
    </span>
  )
}
