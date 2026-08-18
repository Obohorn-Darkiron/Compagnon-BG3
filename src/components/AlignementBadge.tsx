import type { Alignement } from '../data/types'

const styles: Record<Exclude<Alignement, 'neutre'>, { label: string; classe: string }> = {
  sombre: { label: 'Choix sombre', classe: 'bg-essentiel/20 text-essentiel border-essentiel/40' },
  restreint: { label: 'Origine spécifique', classe: 'bg-situationnel/20 text-situationnel border-situationnel/40' },
}

export function AlignementBadge({ alignement }: { alignement: Alignement }) {
  if (alignement === 'neutre') return null
  const { label, classe } = styles[alignement]
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${classe}`}
    >
      {label}
    </span>
  )
}
