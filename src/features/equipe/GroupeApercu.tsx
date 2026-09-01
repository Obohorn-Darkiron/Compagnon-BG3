import { Link } from 'react-router-dom'
import { Section } from '../../components/Section'
import { ImportanceBadge } from '../../components/ImportanceBadge'
import { Check } from '../../components/icons'
import { builds, getObjet, nomAffiche } from '../../data'
import { detecterSynergies, genererConseilsRace } from './composeurEquipe'
import { saveStore } from '../../storage/useSaveData'
import { lireJoueurId } from '../../storage/identite'
import type { Campagne, Personnage } from '../../storage/useSaveData'
import type { Importance } from '../../data/types'

interface EntreeEquipementGroupe {
  perso: Personnage
  importance: Importance
  objetId: string
}

export function GroupeApercu({ campagne }: { campagne: Campagne }) {
  const equipes = campagne.personnages
    .map((perso) => ({ perso, build: builds.find((b) => b.id === perso.buildId) }))
    .filter((x): x is { perso: Personnage; build: NonNullable<typeof x.build> } => Boolean(x.build))

  if (equipes.length < 2) return null

  const parObjet = new Map<string, { perso: Personnage; importance: Importance }[]>()
  for (const { perso, build } of equipes) {
    for (const e of build.equipement) {
      const liste = parObjet.get(e.objetId) ?? []
      liste.push({ perso, importance: e.importance })
      parObjet.set(e.objetId, liste)
    }
  }
  const conflits = [...parObjet.entries()].filter(([, liste]) => liste.length > 1)

  const parActe = new Map<number, Map<string, EntreeEquipementGroupe[]>>()
  for (const { perso, build } of equipes) {
    for (const e of build.equipement) {
      const parObjetDeLActe = parActe.get(e.acte) ?? new Map<string, EntreeEquipementGroupe[]>()
      const liste = parObjetDeLActe.get(e.objetId) ?? []
      liste.push({ perso, importance: e.importance, objetId: e.objetId })
      parObjetDeLActe.set(e.objetId, liste)
      parActe.set(e.acte, parObjetDeLActe)
    }
  }
  const actesTries = [...parActe.keys()].sort((a, b) => a - b)
  const avecSynergies = equipes.filter(({ build }) => build.synergies && build.synergies.length > 0)
  const buildsDuGroupe = equipes.map((e) => e.build)
  const synergiesDetectees = detecterSynergies(buildsDuGroupe)
  const conseilsRace = genererConseilsRace(buildsDuGroupe)

  if (
    conflits.length === 0 &&
    avecSynergies.length === 0 &&
    synergiesDetectees.length === 0 &&
    conseilsRace.length === 0 &&
    actesTries.length === 0
  ) {
    return null
  }

  return (
    <>
      {actesTries.length > 0 && (
        <Section title="Équipement du groupe par acte">
          <div className="flex flex-col gap-4">
            {actesTries.map((acte) => (
              <div key={acte}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Acte {acte}
                </p>
                <div className="flex flex-col gap-2">
                  {[...parActe.get(acte)!.entries()].map(([objetId, entrees]) => {
                    const objet = getObjet(objetId)
                    const partage = entrees.length > 1
                    return (
                      <div
                        key={objetId}
                        className="rounded-lg border border-border bg-surface px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            to={`/explorer/${objetId}`}
                            state={{ from: '/equipe' }}
                            className="min-w-0 truncate text-sm font-medium text-ink underline underline-offset-2"
                          >
                            {objet ? nomAffiche(objet) : objetId}
                          </Link>
                          {partage && (
                            <span className="shrink-0 rounded-full border border-glow/40 bg-glow/10 px-2 py-0.5 text-[10px] font-medium text-glow">
                              Partagé
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-col gap-1.5">
                          {entrees.map(({ perso, importance }) => {
                            const obtenu = perso.objetsObtenus.includes(objetId)
                            const modifiable =
                              perso.proprietaireId === null || perso.proprietaireId === lireJoueurId()
                            return (
                              <button
                                key={perso.id}
                                type="button"
                                disabled={!modifiable}
                                onClick={() =>
                                  saveStore.basculerObjetObtenu(campagne.id, perso.id, objetId)
                                }
                                className="flex items-center justify-between gap-2 disabled:opacity-60"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                      obtenu ? 'border-bon bg-bon/20 text-bon' : 'border-border text-ink-muted'
                                    }`}
                                  >
                                    {obtenu && <Check className="h-3 w-3" />}
                                  </span>
                                  <span
                                    className={`text-xs ${obtenu ? 'text-ink-muted line-through' : 'text-ink-muted'}`}
                                  >
                                    {perso.nom}
                                  </span>
                                </span>
                                <ImportanceBadge importance={importance} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {conflits.length > 0 && (
        <Section title="Objets convoités par plusieurs personnages">
          <div className="flex flex-col gap-2">
            {conflits.map(([objetId, liste]) => {
              const objet = getObjet(objetId)
              return (
                <div
                  key={objetId}
                  className="rounded-lg border border-essentiel/30 bg-surface px-3 py-2.5"
                >
                  <Link
                    to={`/explorer/${objetId}`}
                    state={{ from: '/equipe' }}
                    className="text-sm font-medium text-ink underline underline-offset-2"
                  >
                    {objet ? nomAffiche(objet) : objetId}
                  </Link>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {liste.map(({ perso, importance }) => (
                      <div key={perso.id} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-ink-muted">{perso.nom}</span>
                        <ImportanceBadge importance={importance} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {synergiesDetectees.length > 0 && (
        <Section title="Synergies entre tes personnages">
          <div className="flex flex-col gap-2">
            {synergiesDetectees.map((s, i) => (
              <div key={i} className="rounded-lg border border-bon/30 bg-surface px-3 py-2.5">
                <p className="text-xs font-semibold text-bon">{s.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink">{s.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {conseilsRace.length > 0 && (
        <Section title="Conseils de race">
          <div className="flex flex-col gap-2">
            {conseilsRace.map((c, i) => (
              <div key={i} className="rounded-lg border border-glow/40 bg-glow/10 px-3 py-2.5">
                <p className="text-xs font-semibold text-glow">{c.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink">{c.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {avecSynergies.length > 0 && (
        <Section title="Notes de build">
          <div className="flex flex-col gap-3">
            {avecSynergies.map(({ perso, build }) => (
              <div key={perso.id} className="rounded-lg border border-border bg-surface px-3 py-2.5">
                <p className="text-sm font-semibold text-gold">{perso.nom}</p>
                <p className="mb-2 text-xs text-ink-muted">{build.nom}</p>
                <ul className="space-y-1.5">
                  {build.synergies!.map((s) => {
                    const attention = s.startsWith('Attention')
                    return (
                      <li
                        key={s}
                        className={`flex gap-1.5 text-xs leading-relaxed ${
                          attention ? 'text-essentiel' : 'text-ink'
                        }`}
                      >
                        <span className={attention ? 'text-essentiel' : 'text-bon'}>
                          {attention ? '!' : '+'}
                        </span>
                        <span>{s.replace(/^Attention\s*:\s*/, '')}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
