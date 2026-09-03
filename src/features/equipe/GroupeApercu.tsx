import { Link } from 'react-router-dom'
import { Section } from '../../components/Section'
import { ImportanceBadge } from '../../components/ImportanceBadge'
import { AlignementBadge } from '../../components/AlignementBadge'
import { Check } from '../../components/icons'
import { builds, nomAffiche } from '../../data'
import { detecterSynergies, genererConseilsRace } from './composeurEquipe'
import { resoudreObjetPourStyle, type ObjetResolu } from './alignementUtils'
import { saveStore } from '../../storage/useSaveData'
import { lireJoueurId } from '../../storage/identite'
import type { Campagne, Personnage } from '../../storage/useSaveData'
import type { Importance } from '../../data/types'

interface EntreeEquipementGroupe extends ObjetResolu {
  perso: Personnage
  importance: Importance
  emplacement: string
  acteAffiche: number
}

const ORDRE_IMPORTANCE: Record<Importance, number> = {
  Essentiel: 4,
  Excellent: 3,
  Bon: 2,
  Situationnel: 1,
}

export function GroupeApercu({ campagne }: { campagne: Campagne }) {
  const equipes = campagne.personnages
    .map((perso) => ({ perso, build: builds.find((b) => b.id === perso.buildId) }))
    .filter((x): x is { perso: Personnage; build: NonNullable<typeof x.build> } => Boolean(x.build))

  if (equipes.length < 2) return null

  const buildParPersoId = new Map(equipes.map(({ perso, build }) => [perso.id, build]))

  const toutesEntrees: EntreeEquipementGroupe[] = []
  for (const { perso, build } of equipes) {
    for (const e of build.equipement) {
      const resolu = resoudreObjetPourStyle(e.objetId, perso.styleJeu)
      toutesEntrees.push({
        ...resolu,
        perso,
        importance: e.importance,
        emplacement: e.emplacement,
        acteAffiche: resolu.alternative ? resolu.alternative.acte : e.acte,
      })
    }
  }

  const parObjet = new Map<string, EntreeEquipementGroupe[]>()
  for (const entree of toutesEntrees) {
    const liste = parObjet.get(entree.idAffiche) ?? []
    liste.push(entree)
    parObjet.set(entree.idAffiche, liste)
  }
  const conflits = [...parObjet.entries()].filter(([, liste]) => liste.length > 1)

  /** Pour un personnage en conflit sur un objet, cherche dans SON PROPRE build un autre choix
   * pour le même emplacement — permet de proposer une alternative plutôt que de se disputer l'objet.
   * Passe aussi par la résolution de style, au cas où ce second choix serait lui-même à choix sombre. */
  function alternativePour(perso: Personnage, emplacement: string, objetIdExclu: string) {
    const build = buildParPersoId.get(perso.id)
    if (!build) return null
    const candidats = build.equipement
      .filter((e) => e.emplacement === emplacement && e.objetId !== objetIdExclu)
      .sort((a, b) => ORDRE_IMPORTANCE[b.importance] - ORDRE_IMPORTANCE[a.importance])
    const meilleur = candidats[0]
    if (!meilleur) return null
    const resolu = resoudreObjetPourStyle(meilleur.objetId, perso.styleJeu)
    return { importance: meilleur.importance, resolu }
  }

  const parActe = new Map<number, Map<string, EntreeEquipementGroupe[]>>()
  for (const entree of toutesEntrees) {
    const parObjetDeLActe = parActe.get(entree.acteAffiche) ?? new Map<string, EntreeEquipementGroupe[]>()
    const liste = parObjetDeLActe.get(entree.idAffiche) ?? []
    liste.push(entree)
    parObjetDeLActe.set(entree.idAffiche, liste)
    parActe.set(entree.acteAffiche, parObjetDeLActe)
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
                  {[...parActe.get(acte)!.entries()].map(([idAffiche, entrees]) => {
                    const objet = entrees[0].objet
                    const partage = entrees.length > 1
                    return (
                      <div
                        key={idAffiche}
                        className="rounded-lg border border-border bg-surface px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            to={`/explorer/${idAffiche}`}
                            state={{ from: '/equipe' }}
                            className="min-w-0 truncate text-sm font-medium text-ink underline underline-offset-2"
                          >
                            {objet ? nomAffiche(objet) : idAffiche}
                          </Link>
                          {partage && (
                            <span className="shrink-0 rounded-full border border-glow/40 bg-glow/10 px-2 py-0.5 text-[10px] font-medium text-glow">
                              Partagé
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-col gap-1.5">
                          {entrees.map(({ perso, importance, alternative, sansAlternative, objetOriginal }) => {
                            const obtenu = perso.objetsObtenus.includes(idAffiche)
                            const modifiable =
                              perso.proprietaireId === null || perso.proprietaireId === lireJoueurId()
                            return (
                              <div key={perso.id} className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  disabled={!modifiable}
                                  onClick={() =>
                                    saveStore.basculerObjetObtenu(campagne.id, perso.id, idAffiche)
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
                                  <span className="flex items-center gap-1">
                                    <ImportanceBadge importance={importance} />
                                    {perso.styleJeu === 'bienveillant' && objetOriginal && !alternative && (
                                      <AlignementBadge alignement={objetOriginal.alignement} />
                                    )}
                                  </span>
                                </button>
                                {alternative && objetOriginal && (
                                  <p className="pl-7 text-[11px] text-bon">
                                    Remplace {nomAffiche(objetOriginal)} pour {perso.nom} (choix sombre)
                                  </p>
                                )}
                                {sansAlternative && objetOriginal && (
                                  <p className="pl-7 text-[11px] text-essentiel">
                                    Aucune alternative neutre pour {perso.nom}
                                    {objetOriginal.alignementNote ? ` — ${objetOriginal.alignementNote}` : ''}
                                  </p>
                                )}
                              </div>
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
            {conflits.map(([idAffiche, liste]) => {
              const objet = liste[0].objet
              return (
                <div
                  key={idAffiche}
                  className="rounded-lg border border-essentiel/30 bg-surface px-3 py-2.5"
                >
                  <Link
                    to={`/explorer/${idAffiche}`}
                    state={{ from: '/equipe' }}
                    className="text-sm font-medium text-ink underline underline-offset-2"
                  >
                    {objet ? nomAffiche(objet) : idAffiche}
                  </Link>
                  <div className="mt-1.5 flex flex-col gap-2">
                    {liste.map(({ perso, importance, emplacement }) => {
                      const alternative = alternativePour(perso, emplacement, idAffiche)
                      const objetAlternatif = alternative?.resolu.objet
                      return (
                        <div key={perso.id} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-ink-muted">{perso.nom}</span>
                            <ImportanceBadge importance={importance} />
                          </div>
                          {objetAlternatif && (
                            <Link
                              to={`/explorer/${objetAlternatif.id}`}
                              state={{ from: '/equipe' }}
                              className="text-[11px] text-glow underline underline-offset-2"
                            >
                              Alternative pour {perso.nom} : {nomAffiche(objetAlternatif)} (
                              {alternative!.importance})
                            </Link>
                          )}
                        </div>
                      )
                    })}
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
