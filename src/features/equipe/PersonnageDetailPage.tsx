import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Section } from '../../components/Section'
import { ImportanceBadge } from '../../components/ImportanceBadge'
import { AlignementBadge } from '../../components/AlignementBadge'
import { CaracTable } from '../../components/CaracTable'
import { Check } from '../../components/icons'
import { builds, etapeAuNiveau, getObjet, nomAffiche, races } from '../../data'
import { saveStore, useSaveData, type StyleJeu } from '../../storage/useSaveData'
import { NiveauStepper } from './NiveauStepper'
import { BonusPermanentsSection } from './BonusPermanentsSection'
import { PlanOptimisationSection } from './PlanOptimisationSection'
import { SelecteurBuild } from './SelecteurBuild'
import { bonusParStatObtenus, noteBonusPermanent } from './bonusPermanentsUtils'

const stylesJeu: { valeur: StyleJeu; label: string }[] = [
  { valeur: null, label: 'Peu importe' },
  { valeur: 'bienveillant', label: 'Bienveillant' },
  { valeur: 'neutre', label: 'Neutre / gris' },
]

export function PersonnageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const data = useSaveData()

  const trouvaille = data.campagnes
    .flatMap((c) => c.personnages.map((p) => ({ campagneId: c.id, personnage: p })))
    .find((x) => x.personnage.id === id)

  if (!trouvaille) return <Navigate to="/equipe" replace />

  const { campagneId, personnage } = trouvaille
  const build = builds.find((b) => b.id === personnage.buildId)
  const classeSousClasse = [personnage.classe, personnage.sousClasse].filter(Boolean).join(' · ')
  const raceInfo = races.find((r) => r.nom === personnage.race)

  return (
    <div>
      <PageHeader
        title={personnage.nom}
        subtitle={build?.nom ?? classeSousClasse ?? 'Build à définir'}
        back="/equipe"
      />

      <Section title="Style de jeu">
        <div className="flex flex-wrap gap-1.5">
          {stylesJeu.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => saveStore.majPersonnage(campagneId, personnage.id, { styleJeu: s.valeur })}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                personnage.styleJeu === s.valeur
                  ? 'border-glow/70 bg-glow/15 text-glow'
                  : 'border-border text-ink-muted'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Race">
        {personnage.compagnonNom ? (
          <div className="rounded-lg border border-glow/40 bg-glow/10 px-3 py-2.5">
            <p className="text-sm font-medium text-glow">
              {personnage.sousRace ?? personnage.race ?? 'Race inconnue'}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Race fixe de {personnage.compagnonNom} — un compagnon de l'histoire garde toujours sa
              race d'origine, même reclassé chez Withers.
            </p>
          </div>
        ) : (
          <>
            <select
              value={personnage.race ?? ''}
              onChange={(e) =>
                saveStore.majPersonnage(campagneId, personnage.id, {
                  race: e.target.value || null,
                  sousRace: null,
                })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-glow focus:outline-none"
            >
              <option value="">Peu importe</option>
              {races.map((r) => (
                <option key={r.nom} value={r.nom}>
                  {r.nom}
                </option>
              ))}
            </select>
            {raceInfo?.sousRaces && (
              <select
                value={personnage.sousRace ?? ''}
                onChange={(e) =>
                  saveStore.majPersonnage(campagneId, personnage.id, { sousRace: e.target.value || null })
                }
                className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-glow focus:outline-none"
              >
                <option value="">Sous-race — peu importe</option>
                {raceInfo.sousRaces.map((sr) => (
                  <option key={sr.nom} value={sr.nom}>
                    {sr.nom}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
        {raceInfo && (
          <div className="mt-2 rounded-lg border border-border bg-surface-raised px-3 py-2.5">
            <p className="text-xs leading-relaxed text-ink-muted">{raceInfo.resume}</p>
            {!raceInfo.verifie && (
              <p className="mt-1.5 text-[11px] text-ink-muted">
                Résumé qualitatif, traits précis non vérifiés dans cette fiche.
              </p>
            )}
          </div>
        )}
      </Section>

      <Section title="Build associé">
        <p className="mb-2 text-xs text-ink-muted">
          Change de build à tout moment ici — c'est ton "respec" : niveau, équipement et bonus se
          recalculent automatiquement sur le nouveau build.
        </p>
        <SelecteurBuild
          buildIdActuel={personnage.buildId}
          onChoisir={(nouveauBuild) =>
            saveStore.majPersonnage(campagneId, personnage.id, {
              buildId: nouveauBuild?.id ?? null,
              classe: nouveauBuild?.classe ?? personnage.classe,
              sousClasse: nouveauBuild?.sousClasse ?? personnage.sousClasse,
            })
          }
        />
        {build && (
          <Link
            to={`/builds/${build.id}`}
            className="mt-2 inline-block text-sm text-gold underline underline-offset-2"
          >
            Voir la fiche complète du build
          </Link>
        )}
      </Section>

      {build ? (
        <Section title="Répartition de départ">
          <CaracTable caracDepart={build.caracDepart} />
        </Section>
      ) : classeSousClasse ? (
        <Section title="Répartition de départ">
          <p className="text-sm text-ink-muted">
            Pas encore de build détaillé pour {classeSousClasse} — dès que j'en ajoute un, la
            répartition de caractéristiques recommandée apparaîtra ici.
          </p>
        </Section>
      ) : null}

      {build && <BonusPermanentsSection campagneId={campagneId} personnage={personnage} />}
      {build && <PlanOptimisationSection build={build} personnage={personnage} />}

      <Section title={`Niveau ${personnage.niveau}`}>
        <NiveauStepper
          niveau={personnage.niveau}
          onChange={(n) =>
            saveStore.majPersonnage(campagneId, personnage.id, { niveau: n })
          }
        />
        {build ? (
          (() => {
            const etape = etapeAuNiveau(build, personnage.niveau)
            const note = noteBonusPermanent(build, bonusParStatObtenus(personnage), personnage.niveau)
            return (
              <div className="mt-3 flex flex-col gap-2">
                <div className="rounded-lg border border-border bg-surface px-3 py-3">
                  {etape ? (
                    <>
                      <p className="text-sm font-medium text-gold">{etape.titre}</p>
                      <p className="mt-1 text-sm text-ink-muted">{etape.detail}</p>
                    </>
                  ) : (
                    <p className="text-sm text-ink-muted">
                      Rien de particulier à décider à ce niveau — continue de jouer, la prochaine
                      étape arrivera bientôt.
                    </p>
                  )}
                </div>
                {note && (
                  <div className="rounded-lg border border-glow/40 bg-glow/10 px-3 py-2.5">
                    <p className="text-xs text-ink">{note}</p>
                  </div>
                )}
              </div>
            )
          })()
        ) : (
          <p className="mt-3 text-sm text-ink-muted">
            Choisis un build ci-dessus pour voir les décisions à prendre à chaque niveau.
          </p>
        )}
      </Section>

      {build && (
        <Section title="Équipement à obtenir">
          <div className="flex flex-col gap-2">
            {build.equipement.map((e, i) => {
              const objet = getObjet(e.objetId)
              const obtenu = personnage.objetsObtenus.includes(e.objetId)
              return (
                <div
                  key={`${e.objetId}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => saveStore.basculerObjetObtenu(campagneId, personnage.id, e.objetId)}
                    aria-label={obtenu ? 'Marquer comme non obtenu' : 'Marquer comme obtenu'}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      obtenu ? 'border-bon bg-bon/20 text-bon' : 'border-border text-ink-muted'
                    }`}
                  >
                    {obtenu && <Check className="h-4 w-4" />}
                  </button>
                  <Link
                    to={`/explorer/${e.objetId}`}
                    state={{ from: `/equipe/${personnage.id}` }}
                    className="min-w-0 flex-1"
                  >
                    <p
                      className={`truncate text-sm font-medium ${obtenu ? 'text-ink-muted line-through' : 'text-ink'}`}
                    >
                      {objet ? nomAffiche(objet) : e.objetId}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {e.emplacement} · Acte {e.acte}
                    </p>
                  </Link>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <ImportanceBadge importance={e.importance} />
                    {personnage.styleJeu === 'bienveillant' && objet && (
                      <AlignementBadge alignement={objet.alignement} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      <div className="px-4 py-6">
        <button
          type="button"
          onClick={() => {
            if (confirm(`Supprimer ${personnage.nom} ?`)) {
              saveStore.supprimerPersonnage(campagneId, personnage.id)
              navigate('/equipe')
            }
          }}
          className="w-full rounded-lg border border-essentiel/40 py-2.5 text-sm text-essentiel"
        >
          Supprimer ce personnage
        </button>
      </div>
    </div>
  )
}
