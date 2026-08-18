import { Check } from '../../components/icons'

export function NiveauStepper({
  niveau,
  onChange,
}: {
  niveau: number
  onChange: (niveau: number) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
        const fait = n < niveau
        const actuel = n === niveau
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`Niveau ${n}`}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
              actuel
                ? 'border-gold bg-gold text-bg'
                : fait
                  ? 'border-gold-soft/60 bg-surface text-gold'
                  : 'border-border bg-surface text-ink-muted'
            }`}
          >
            {fait ? <Check className="h-4 w-4" /> : n}
          </button>
        )
      })}
    </div>
  )
}
