import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Section } from '../../components/Section'
import { ImportanceBadge } from '../../components/ImportanceBadge'
import { CaracTable } from '../../components/CaracTable'
import { AlignementBadge } from '../../components/AlignementBadge'
import { SourceAlternativeBadge } from '../../components/SourceAlternativeBadge'
import { alternativesPourBuild, getBuild, nomAffiche } from '../../data'
import { conseilRacePourBuild } from '../equipe/composeurEquipe'
import { dedupliquerParIdAffiche, resoudreObjetPourStyle, type ObjetResolu } from '../equipe/alignementUtils'
import type { ChoixSort, Importance } from '../../data/types'

interface EquipementResoluAffiche extends ObjetResolu {
  emplacement: string
  importance: Importance
  acteAffiche: number
}

type StylePreview = 'bienveillant' | 'neutre' | 'sombre' | null

const stylesPreview: { valeur: StylePreview; label: string }[] = [
  { valeur: null, label: 'Peu importe' },
  { valeur: 'bienveillant', label: 'Bienveillant' },
  { valeur: 'neutre', label: 'Neutre / gris' },
  { valeur: 'sombre', label: 'Sombre' },
]

type OngletProgression = 'progression' | 'sorts'

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

export function BuildDetailPage() {
  const { id } = useParams<{ id: string }>()
  const build = id ? getBuild(id) : undefined
  const [stylePreview, setStylePreview] = useState<StylePreview>(null)
  const [ongletProgression, setOngletProgression] = useState<OngletProgression>('progression')

  const equipementParActe = useMemo(() => {
    if (!build) return new Map<number, EquipementResoluAffiche[]>()
    // Une alternative peut retomber sur un objet déjà présent ailleurs dans l'équipement — on
    // fusionne par idAffiche plutôt que d'afficher deux fois la même ligne (voir alignementUtils).
    const entrees = build.equipement.map((e): EquipementResoluAffiche => {
      const resolu = resoudreObjetPourStyle(e.objetId, stylePreview, e.emplacement)
      return {
        ...resolu,
        emplacement: e.emplacement,
        importance: e.importance,
        acteAffiche: resolu.alternative ? resolu.alternative.acte : e.acte,
      }
    })
    const parActe = new Map<number, EquipementResoluAffiche[]>()
    for (const e of dedupliquerParIdAffiche(entrees)) {
      const liste = parActe.get(e.acteAffiche) ?? []
      liste.push(e)
      parActe.set(e.acteAffiche, liste)
    }
    return parActe
  }, [build, stylePreview])
  const actesEquipement = [...equipementParActe.keys()].sort((a, b) => a - b)

  if (!build) return <Navigate to="/builds" replace />

  const alternatives = alternativesPourBuild(build)
  const conseilRace = conseilRacePourBuild(build)

  return (
    <div>
      <PageHeader title={build.nom} subtitle={build.split} back="/builds" />

      <Section title="Résumé">
        <p className="text-sm leading-relaxed text-ink">{build.resume}</p>
      </Section>

      <Section title="Caractéristiques de départ">
        <CaracTable caracDepart={build.caracDepart} />
      </Section>

      {conseilRace && (
        <Section title="Race conseillée">
          <div className="rounded-lg border border-glow/40 bg-glow/10 px-3 py-2.5">
            <p className="text-sm font-semibold text-glow">{conseilRace.race}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink">
              {conseilRace.description(build.nom)}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">
            Un vrai bénéfice mécanique vérifié pour ce build précis — d'autres races restent
            jouables, celle-ci n'est juste pas laissée au hasard.
          </p>
        </Section>
      )}

      <Section title="Forces & faiblesses">
        <div className="grid grid-cols-1 gap-3">
          <ul className="space-y-1.5">
            {build.forces.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-ink">
                <span className="text-bon">+</span>
                {f}
              </li>
            ))}
          </ul>
          <ul className="space-y-1.5">
            {build.faiblesses.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-ink">
                <span className="text-essentiel">−</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {build.synergies && build.synergies.length > 0 && (
        <Section title="Synergies">
          <ul className="space-y-1.5">
            {build.synergies.map((s) => (
              <li key={s} className="text-sm text-ink">
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {build.dons.length > 0 && (
        <Section title="Dons">
          <ul className="space-y-1.5">
            {build.dons.map((d) => (
              <li key={d} className="text-sm text-ink">
                {d}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {build.sortsCles.length > 0 && (
        <Section title="Sorts clés">
          <div className="flex flex-wrap gap-1.5">
            {build.sortsCles.map((s) => (
              <span
                key={s}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-ink"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Progression niveau par niveau">
        <div className="mb-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => setOngletProgression('progression')}
            className={`flex-1 rounded-full border px-2 py-2.5 text-xs font-medium transition-colors ${
              ongletProgression === 'progression'
                ? 'border-glow/70 bg-glow/15 text-glow'
                : 'border-border text-ink-muted'
            }`}
          >
            Progression & dons
          </button>
          <button
            type="button"
            onClick={() => setOngletProgression('sorts')}
            className={`flex-1 rounded-full border px-2 py-2.5 text-xs font-medium transition-colors ${
              ongletProgression === 'sorts'
                ? 'border-glow/70 bg-glow/15 text-glow'
                : 'border-border text-ink-muted'
            }`}
          >
            Sorts
          </button>
        </div>

        {ongletProgression === 'progression' && (
          <>
            <p className="mb-3 text-xs leading-relaxed text-ink-muted">
              Ce qui se débloque à chaque niveau et le don à prendre, dans l'ordre.
            </p>
            <ol className="space-y-3 border-l border-border pl-4">
              {build.progression.map((etape) => (
                <li key={etape.niveau} className="relative">
                  <span className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-bg">
                    {etape.niveau}
                  </span>
                  <p className="text-sm font-medium text-ink">{etape.titre}</p>
                  {etape.don && (
                    <p className="mt-1">
                      <span className="inline-flex items-center rounded-md border border-gold/40 bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">
                        Don : {etape.don}
                      </span>
                    </p>
                  )}
                  <p className="mt-1 text-sm text-ink-muted">{etape.detail}</p>
                </li>
              ))}
            </ol>
          </>
        )}

        {ongletProgression === 'sorts' && (
          <>
            {build.progression.some((e) => e.sorts && e.sorts.length > 0) ? (
              <>
                <p className="mb-3 text-xs leading-relaxed text-ink-muted">
                  Les sorts à prendre, échanger ou garder, niveau par niveau.
                </p>
                <ol className="space-y-3 border-l border-border pl-4">
                  {build.progression
                    .filter((e) => e.sorts && e.sorts.length > 0)
                    .map((etape) => (
                      <li key={etape.niveau} className="relative">
                        <span className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-bg">
                          {etape.niveau}
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {etape.sorts!.map((sort) => (
                            <div key={sort.nom} className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STYLES_TYPE_SORT[sort.type]}`}
                              >
                                {LABELS_TYPE_SORT[sort.type]}
                              </span>
                              <span className="text-sm font-bold text-ink">{sort.nom}</span>
                              {sort.note && (
                                <span className="text-xs text-ink-muted">— {sort.note}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </li>
                    ))}
                </ol>
              </>
            ) : (
              <p className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-xs text-ink-muted">
                Ce build n'a pas encore de détail sorts structuré niveau par niveau — voir
                l'onglet « Progression & dons » et « Sorts clés » plus haut en attendant.
              </p>
            )}
          </>
        )}
      </Section>

      <Section title="Équipement recommandé">
        <div className="mb-3 flex gap-1.5">
          {stylesPreview.map((s) => (
            <button
              key={String(s.valeur)}
              type="button"
              onClick={() => setStylePreview(s.valeur)}
              className={`flex-1 rounded-full border px-2 py-2.5 text-xs font-medium transition-colors ${
                stylePreview === s.valeur
                  ? 'border-glow/70 bg-glow/15 text-glow'
                  : 'border-border text-ink-muted'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {stylePreview === 'bienveillant' && (
          <p className="mb-2 text-xs text-ink-muted">
            Les objets à choix moral sont remplacés par leur alternative neutre quand elle
            existe.
          </p>
        )}
        {stylePreview === 'neutre' && (
          <p className="mb-2 text-xs text-ink-muted">
            Style neutre : tous les objets ci-dessous restent accessibles, y compris ceux à
            choix moral.
          </p>
        )}
        {stylePreview === 'sombre' && (
          <p className="mb-2 text-xs text-ink-muted">
            Voie sombre assumée : tous les objets ci-dessous restent accessibles, y compris ceux
            qui demandent un choix sombre (culte de Bhaal, routes non-bienveillantes...).
          </p>
        )}
        <div className="flex flex-col gap-4">
          {actesEquipement.map((acte) => (
            <div key={acte}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Acte {acte}
              </p>
              <div className="flex flex-col gap-2">
                {equipementParActe.get(acte)!.map((e) => {
                  const { objetOriginal, alternative, alternativeAutoTrouvee, sansAlternative } = e
                  const objetAffiche = alternative ?? objetOriginal
                  const afficherBadgeAlignement =
                    objetOriginal &&
                    !alternative &&
                    (objetOriginal.alignement === 'restreint' ||
                      (stylePreview === 'bienveillant' && objetOriginal.alignement === 'sombre'))

                  return (
                    <div
                      key={e.idAffiche}
                      className="rounded-lg border border-border bg-surface px-3 py-2.5"
                    >
                      <Link
                        to={`/explorer/${e.idAffiche}`}
                        state={{ from: `/builds/${build.id}` }}
                        className="flex items-center justify-between gap-3 active:opacity-70"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {objetAffiche ? nomAffiche(objetAffiche) : e.idAffiche}
                          </p>
                          <p className="text-xs text-ink-muted">{e.emplacement}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <ImportanceBadge importance={e.importance} />
                          {afficherBadgeAlignement && objetOriginal && (
                            <AlignementBadge alignement={objetOriginal.alignement} />
                          )}
                        </div>
                      </Link>
                      {alternative && objetOriginal && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <SourceAlternativeBadge autoTrouvee={alternativeAutoTrouvee} />
                          <p className="text-xs text-ink-muted">
                            à la place de {nomAffiche(objetOriginal)}
                            {objetOriginal.alignementNote ? ` — ${objetOriginal.alignementNote}` : ''}
                          </p>
                        </div>
                      )}
                      {sansAlternative && objetOriginal && (
                        <p className="mt-1.5 text-xs text-essentiel">
                          Aucune alternative neutre connue
                          {objetOriginal.alignementNote ? ` — ${objetOriginal.alignementNote}` : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {alternatives.length > 0 && (
        <Section title="Envie d'adapter ce build ?">
          <div className="flex flex-col gap-2">
            {alternatives.map(({ build: alt, raison }) => (
              <Link
                key={alt.id}
                to={`/builds/${alt.id}`}
                className="rounded-lg border border-border bg-surface px-3 py-2.5 active:bg-surface-raised"
              >
                <p className="truncate text-sm font-medium text-gold">{alt.nom}</p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">{raison}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
