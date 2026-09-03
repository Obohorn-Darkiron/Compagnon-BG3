import type { ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Section } from '../../components/Section'
import { ClasseIcon } from '../../components/ClasseIcon'
import { ElementBadge } from '../../components/ElementBadge'
import { MulticlasseBadge } from '../../components/MulticlasseBadge'
import { estMulticlasse, getBuild } from '../../data'
import type { Build, CaracDepart } from '../../data/types'
import { LABELS_ROLE } from '../equipe/composeurEquipe'

const labelsCarac: Record<keyof CaracDepart, string> = {
  FOR: 'Force',
  DEX: 'Dextérité',
  CON: 'Constitution',
  INT: 'Intelligence',
  SAG: 'Sagesse',
  CHA: 'Charisme',
}

function EnTeteBuild({ build }: { build: Build }) {
  return (
    <Link to={`/builds/${build.id}`} className="min-w-0 active:opacity-70">
      <span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-gold-soft/50 bg-gold/10 text-gold">
        <ClasseIcon classe={build.classe} className="h-4 w-4" />
      </span>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gold">
        {build.classe} · {build.sousClasse}
      </p>
      <p className="font-title text-sm font-semibold leading-tight text-ink">{build.nom}</p>
    </Link>
  )
}

function ListeComparee({ a, b }: { a: string[]; b: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <ul className="space-y-1.5">
        {a.map((item) => (
          <li key={item} className="text-xs leading-relaxed text-ink">
            {item}
          </li>
        ))}
      </ul>
      <ul className="space-y-1.5">
        {b.map((item) => (
          <li key={item} className="text-xs leading-relaxed text-ink">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function BadgesCompares({
  a,
  b,
  render,
}: {
  a: string[]
  b: string[]
  render: (valeur: string) => ReactNode
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-wrap gap-1.5">
        {a.length > 0 ? a.map((v) => <span key={v}>{render(v)}</span>) : <Placeholder />}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {b.length > 0 ? b.map((v) => <span key={v}>{render(v)}</span>) : <Placeholder />}
      </div>
    </div>
  )
}

function Placeholder() {
  return <span className="text-xs text-ink-muted">—</span>
}

export function ComparerBuildsPage() {
  const { idA, idB } = useParams<{ idA: string; idB: string }>()
  const buildA = idA ? getBuild(idA) : undefined
  const buildB = idB ? getBuild(idB) : undefined

  if (!buildA || !buildB) return <Navigate to="/builds" replace />

  return (
    <div>
      <PageHeader title="Comparer" subtitle={`${buildA.nom} vs ${buildB.nom}`} back="/builds" />

      <Section title="Builds comparés">
        <div className="grid grid-cols-2 gap-3">
          <EnTeteBuild build={buildA} />
          <EnTeteBuild build={buildB} />
        </div>
      </Section>

      <Section title="Rôle">
        <div className="grid grid-cols-2 gap-3">
          <p className="text-xs text-ink">{buildA.role}</p>
          <p className="text-xs text-ink">{buildB.role}</p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <MulticlasseBadge multiclasse={estMulticlasse(buildA)} />
          <MulticlasseBadge multiclasse={estMulticlasse(buildB)} />
        </div>
      </Section>

      <Section title="Résumé">
        <div className="grid grid-cols-2 gap-3">
          <p className="text-xs leading-relaxed text-ink-muted">{buildA.resume}</p>
          <p className="text-xs leading-relaxed text-ink-muted">{buildB.resume}</p>
        </div>
      </Section>

      <Section title="Caractéristiques de départ">
        <div className="flex flex-col gap-1.5">
          {(Object.keys(labelsCarac) as (keyof CaracDepart)[]).map((cle) => {
            const valA = buildA.caracDepart[cle]
            const valB = buildB.caracDepart[cle]
            return (
              <div key={cle} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <p className="text-xs text-ink-muted">{labelsCarac[cle]}</p>
                <p
                  className={`w-10 rounded-lg border px-2 py-1 text-center font-title text-sm font-semibold ${
                    valA > valB
                      ? 'border-bon/40 bg-bon/15 text-bon'
                      : 'border-border bg-surface text-ink'
                  }`}
                >
                  {valA}
                </p>
                <p
                  className={`w-10 rounded-lg border px-2 py-1 text-center font-title text-sm font-semibold ${
                    valB > valA
                      ? 'border-bon/40 bg-bon/15 text-bon'
                      : 'border-border bg-surface text-ink'
                  }`}
                >
                  {valB}
                </p>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Éléments">
        <BadgesCompares
          a={buildA.elements}
          b={buildB.elements}
          render={(v) => <ElementBadge element={v as Build['elements'][number]} />}
        />
      </Section>

      <Section title="Rôles de groupe">
        <BadgesCompares
          a={buildA.roles}
          b={buildB.roles}
          render={(v) => (
            <span className="rounded-full border border-border bg-surface-raised px-2 py-0.5 text-[11px] text-ink-muted">
              {LABELS_ROLE[v as Build['roles'][number]]}
            </span>
          )}
        />
      </Section>

      <Section title="Forces">
        <ListeComparee a={buildA.forces} b={buildB.forces} />
      </Section>

      <Section title="Faiblesses">
        <ListeComparee a={buildA.faiblesses} b={buildB.faiblesses} />
      </Section>

      {(buildA.sortsCles.length > 0 || buildB.sortsCles.length > 0) && (
        <Section title="Sorts clés">
          <BadgesCompares
            a={buildA.sortsCles}
            b={buildB.sortsCles}
            render={(v) => (
              <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-ink">
                {v}
              </span>
            )}
          />
        </Section>
      )}

      {(buildA.dons.length > 0 || buildB.dons.length > 0) && (
        <Section title="Dons">
          <ListeComparee a={buildA.dons} b={buildB.dons} />
        </Section>
      )}
    </div>
  )
}
