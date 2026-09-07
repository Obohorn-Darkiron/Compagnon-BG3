import type { ChoixSort, EtapeProgression } from '../data/types'

const LABELS_GROUPE_SORT: Record<ChoixSort['type'], string> = {
  nouveau: 'Nouveau',
  toujoursPrepare: 'Toujours préparé',
  echange: 'Échange possible',
}

const COULEURS_GROUPE_SORT: Record<ChoixSort['type'], string> = {
  nouveau: 'text-bon',
  toujoursPrepare: 'text-situationnel',
  echange: 'text-glow',
}

function GroupeSorts({ type, sorts }: { type: ChoixSort['type']; sorts: ChoixSort[] }) {
  if (sorts.length === 0) return null
  return (
    <div>
      <p
        className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${COULEURS_GROUPE_SORT[type]}`}
      >
        {LABELS_GROUPE_SORT[type]}
      </p>
      <div className="flex flex-col gap-1">
        {sorts.map((sort) => (
          <p key={sort.nom} className="text-sm">
            {sort.type === 'echange' && sort.ancien && (
              <>
                <span className="text-ink-muted line-through">{sort.ancien}</span>
                <span className="mx-1 text-ink-muted">→</span>
              </>
            )}
            <span className="font-bold text-ink">{sort.nom}</span>
            {sort.note && (
              <span className="ml-1 text-xs font-normal text-ink-muted">— {sort.note}</span>
            )}
          </p>
        ))}
      </div>
    </div>
  )
}

/**
 * Carte pour un niveau de progression, utilisée à la fois sur la fiche build (liste des 12
 * niveaux) et sur la fiche personnage (un seul niveau via le stepper) — pour ne jamais les
 * faire diverger. Trois blocs empilés et jamais redondants entre eux : étiquette courte +
 * capacités de classe propres au niveau, puis le don (nature + effet) si applicable, puis les
 * sorts groupés par type (nouveau / toujours préparé / échange) si applicable.
 */
export function EtapeProgressionCard({ etape }: { etape: EtapeProgression }) {
  const sorts = etape.sorts ?? []
  const nouveaux = sorts.filter((s) => s.type === 'nouveau')
  const toujoursPrepares = sorts.filter((s) => s.type === 'toujoursPrepare')
  const echanges = sorts.filter((s) => s.type === 'echange')

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-border bg-surface px-3 py-3">
        <p className="text-sm font-medium text-gold">{etape.titre}</p>
        {etape.detail && <p className="mt-1 text-sm text-ink-muted">{etape.detail}</p>}
      </div>

      {etape.don && (
        <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gold">Don</p>
          <p className="mt-1 text-sm font-bold text-ink">{etape.don.nom}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{etape.don.effet}</p>
        </div>
      )}

      {sorts.length > 0 && (
        <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5">
          <GroupeSorts type="nouveau" sorts={nouveaux} />
          <GroupeSorts type="toujoursPrepare" sorts={toujoursPrepares} />
          <GroupeSorts type="echange" sorts={echanges} />
        </div>
      )}
    </div>
  )
}
