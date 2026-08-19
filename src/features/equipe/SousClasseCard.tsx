import type { SousClasseInfo } from '../../data'

export function SousClasseCard({
  sousClasse,
  selectionnee,
  onSelect,
}: {
  sousClasse: SousClasseInfo
  selectionnee: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border p-3 text-left transition-colors ${
        selectionnee ? 'border-glow/70 bg-glow/10' : 'border-border bg-surface-raised'
      }`}
    >
      <p className="text-sm font-semibold text-ink">{sousClasse.nom}</p>
      <p className="mt-1 text-xs text-ink-muted">{sousClasse.resume}</p>
      <div className="mt-2 grid grid-cols-1 gap-1">
        {sousClasse.avantages.map((a) => (
          <p key={a} className="flex gap-1.5 text-xs text-ink">
            <span className="text-bon">+</span>
            {a}
          </p>
        ))}
        {sousClasse.inconvenients.map((i) => (
          <p key={i} className="flex gap-1.5 text-xs text-ink">
            <span className="text-essentiel">−</span>
            {i}
          </p>
        ))}
      </div>
    </button>
  )
}
