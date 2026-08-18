import type { CaracDepart } from '../data/types'

const labelsCarac: Record<keyof CaracDepart, string> = {
  FOR: 'Force',
  DEX: 'Dextérité',
  CON: 'Constitution',
  INT: 'Intelligence',
  SAG: 'Sagesse',
  CHA: 'Charisme',
}

export function CaracTable({ caracDepart }: { caracDepart: CaracDepart }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(caracDepart).map(([cle, valeur]) => (
        <div
          key={cle}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-center"
        >
          <p className="text-[11px] uppercase tracking-wide text-ink-muted">
            {labelsCarac[cle as keyof CaracDepart] ?? cle}
          </p>
          <p className="font-title text-lg font-semibold text-ink">{valeur}</p>
        </div>
      ))}
    </div>
  )
}
