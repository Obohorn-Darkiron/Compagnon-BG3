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
import { resoudreObjetPourStyle, type ObjetResolu } from '../equipe/alignementUtils'
import type { Importance } from '../../data/types'

interface EquipementResoluAffiche extends ObjetResolu {
  emplacement: string
  importance: Importance
  acteAffiche: number
}

const ORDRE_IMPORTANCE: Record<Importance, number> = {
  Essentiel: 4,
  Excellent: 3,
  Bon: 2,
  Situationnel: 1,
}

type StylePreview = 'bienveillant' | 'neutre' | 'sombre' | null

const stylesPreview: { valeur: StylePreview; label: string }[] = [
  { valeur: null, label: 'Peu importe' },
  { valeur: 'bienveillant', label: 'Bienveillant' },
  { valeur: 'neutre', label: 'Neutre / gris' },
  { valeur: 'sombre', label: 'Sombre' },
]

export function BuildDetailPage() {
  const { id } = useParams<{ id: string }>()
  const build = id ? getBuild(id) : undefined
  const [stylePreview, setStylePreview] = useState<StylePreview>(null)

  const equipementDeduplique = useMemo(() => {
    if (!build) return []
    // Une alternative peut retomber sur un objet déjà présent ailleurs dans l'équipement — on
    // fusionne par idAffiche plutôt que d'afficher deux fois la même ligne (voir GroupeApercu).
    const parId = new Map<string, EquipementResoluAffiche>()
    for (const e of build.equipement) {
      const resolu = resoudreObjetPourStyle(e.objetId, stylePreview, e.emplacement)
      const entree: EquipementResoluAffiche = {
        ...resolu,
        emplacement: e.emplacement,
        importance: e.importance,
        acteAffiche: resolu.alternative ? resolu.alternative.acte : e.acte,
      }
      const existante = parId.get(resolu.idAffiche)
      if (!existante) {
        parId.set(resolu.idAffiche, entree)
      } else {
        const source = existante.alternative ? existante : entree.alternative ? entree : existante
        parId.set(resolu.idAffiche, {
          ...(ORDRE_IMPORTANCE[entree.importance] > ORDRE_IMPORTANCE[existante.importance]
            ? entree
            : existante),
          alternative: source.alternative,
          alternativeAutoTrouvee: source.alternativeAutoTrouvee,
          objetOriginal: source.objetOriginal,
          sansAlternative: existante.sansAlternative && entree.sansAlternative,
        })
      }
    }
    return [...parId.values()]
  }, [build, stylePreview])

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

      <Section title="Jalons">
        <ol className="space-y-3 border-l border-border pl-4">
          {build.jalons.map((j) => (
            <li key={j.etape} className="relative">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-gold" />
              <p className="text-sm font-medium text-ink">{j.etape}</p>
              <p className="text-sm text-ink-muted">{j.note}</p>
            </li>
          ))}
        </ol>
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
        <div className="flex flex-col gap-2">
          {equipementDeduplique.map((e) => {
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
                    <p className="text-xs text-ink-muted">
                      {e.emplacement} · Acte {e.acteAffiche}
                    </p>
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
