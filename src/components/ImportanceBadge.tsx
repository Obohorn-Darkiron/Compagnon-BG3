import type { Importance } from '../data/types'

const styles: Record<Importance, string> = {
  Essentiel: 'bg-essentiel/20 text-essentiel border-essentiel/40',
  Excellent: 'bg-excellent/20 text-excellent border-excellent/40',
  Bon: 'bg-bon/20 text-bon border-bon/40',
  Situationnel: 'bg-situationnel/20 text-situationnel border-situationnel/40',
}

export function ImportanceBadge({ importance }: { importance: Importance }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[importance]}`}
    >
      {importance}
    </span>
  )
}
