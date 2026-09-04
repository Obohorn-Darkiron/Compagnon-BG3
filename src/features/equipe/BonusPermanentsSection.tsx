import { Section } from '../../components/Section'
import { Check } from '../../components/icons'
import { BONUS_PERMANENTS, labelsCarac, type CleCarac } from '../../data/permanents'
import { saveStore, type Personnage } from '../../storage/useSaveData'

const touteLesCaracs: CleCarac[] = ['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA']

export function BonusPermanentsSection({
  campagneId,
  personnage,
}: {
  campagneId: string
  personnage: Personnage
}) {
  return (
    <Section title="Bonus permanents">
      <p className="mb-2 text-xs text-ink-muted">
        Coche ceux que tu as vraiment obtenus en jeu — ça adapte les augmentations de
        caractéristiques du build.
      </p>
      <div className="flex flex-col gap-2">
        {BONUS_PERMANENTS.map((bonus) => {
          const obtenu = personnage.objetsObtenus.includes(bonus.objetId)
          const choix = personnage.choixBonusPermanents[bonus.objetId]
          return (
            <div key={bonus.objetId} className="rounded-lg border border-border bg-surface px-3 py-2.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => saveStore.basculerObjetObtenu(campagneId, personnage.id, bonus.objetId)}
                  aria-label={obtenu ? 'Marquer comme non obtenu' : 'Marquer comme obtenu'}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    obtenu ? 'border-bon bg-bon/20 text-bon' : 'border-border text-ink-muted'
                  }`}
                >
                  {obtenu && <Check className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{bonus.label}</p>
                  <p className="text-xs text-ink-muted">{bonus.description}</p>
                </div>
              </div>

              {bonus.avertissement && (
                <p className="mt-2 ml-11 rounded-lg border border-glow/30 bg-glow/5 px-2.5 py-2 text-[11px] leading-relaxed text-ink-muted">
                  {bonus.avertissement}
                </p>
              )}

              {obtenu && bonus.statFixe === null && (
                <div className="mt-2 pl-11">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-ink-muted">
                    Sur quelle caractéristique ?
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {touteLesCaracs.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          saveStore.definirChoixBonusPermanent(campagneId, personnage.id, bonus.objetId, {
                            stat: c,
                          })
                        }
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          choix?.stat === c
                            ? 'border-glow/70 bg-glow/15 text-glow'
                            : 'border-border text-ink-muted'
                        }`}
                      >
                        {labelsCarac[c]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {obtenu && bonus.valeursPossibles.length > 1 && (
                <div className="mt-2 pl-11">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-ink-muted">
                    Combien as-tu obtenu ?
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {bonus.valeursPossibles.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          saveStore.definirChoixBonusPermanent(campagneId, personnage.id, bonus.objetId, {
                            valeur: v,
                          })
                        }
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          (choix?.valeur ?? bonus.valeursPossibles[0]) === v
                            ? 'border-glow/70 bg-glow/15 text-glow'
                            : 'border-border text-ink-muted'
                        }`}
                      >
                        +{v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}
