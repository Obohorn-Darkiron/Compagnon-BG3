import { Section } from '../../components/Section'
import { Check } from '../../components/icons'
import { COMPAGNONS } from './composeurEquipe'
import { saveStore } from '../../storage/useSaveData'
import type { Campagne } from '../../storage/useSaveData'

export function CompagnonsSuivi({ campagne }: { campagne: Campagne }) {
  const recrutes = campagne.compagnonsRecrutes

  return (
    <Section title={`Compagnons de l'histoire — ${recrutes.length}/${COMPAGNONS.length} recrutés`}>
      <div className="flex flex-col gap-2">
        {COMPAGNONS.map((c) => {
          const estRecrute = recrutes.includes(c.nom)
          return (
            <button
              key={c.nom}
              type="button"
              onClick={() => saveStore.basculerCompagnonRecrute(campagne.id, c.nom)}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left active:bg-surface-raised"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                  estRecrute ? 'border-bon bg-bon/20 text-bon' : 'border-border text-ink-muted'
                }`}
              >
                {estRecrute && <Check className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${estRecrute ? 'text-ink-muted line-through' : 'text-ink'}`}>
                  {c.nom}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {c.race} · {c.classeDefaut}
                </p>
              </div>
              <span className="shrink-0 text-right text-[11px] text-ink-muted">{c.acte}</span>
            </button>
          )
        })}
      </div>
    </Section>
  )
}
