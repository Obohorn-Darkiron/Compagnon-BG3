import { useState } from 'react'
import { ClasseIcon } from '../../components/ClasseIcon'
import { ChevronLeft } from '../../components/icons'
import {
  builds,
  buildsPourClasse,
  buildsPourClasseEtSousClasse,
  classesDisponibles,
  getBuild,
  sousClassesPourClasse,
  type Build,
} from '../../data'
import type { ElementTag, MecaniqueTag, RoleTag } from '../../data/types'
import { LABELS_ELEMENT, LABELS_MECANIQUE, NOTE_ELEMENT_FAIBLE } from '../../components/elementLabels'
import { LABELS_ROLE } from './composeurEquipe'
import { SousClasseCard } from './SousClasseCard'
import { BuildCandidatCard } from './BuildCandidatCard'

const elementsDisponibles = Object.keys(LABELS_ELEMENT) as ElementTag[]
const mecaniquesDisponibles = Object.keys(LABELS_MECANIQUE) as MecaniqueTag[]
const rolesDisponibles = Object.keys(LABELS_ROLE) as RoleTag[]

export function SelecteurBuild({
  buildIdActuel,
  onChoisir,
}: {
  buildIdActuel: string | null
  onChoisir: (build: Build | null) => void
}) {
  const buildActuel = buildIdActuel ? getBuild(buildIdActuel) : undefined
  const [ouvert, setOuvert] = useState(false)
  const [classe, setClasse] = useState(buildActuel?.classe ?? '')
  const [sousClasse, setSousClasse] = useState(buildActuel?.sousClasse ?? '')
  const [elementFiltre, setElementFiltre] = useState<ElementTag | null>(null)
  const [mecaniqueFiltre, setMecaniqueFiltre] = useState<MecaniqueTag | null>(null)
  const [roleFiltre, setRoleFiltre] = useState<RoleTag | null>(null)

  const filtreActif = elementFiltre !== null || mecaniqueFiltre !== null || roleFiltre !== null
  function buildCorrespondAuFiltre(b: Build): boolean {
    if (elementFiltre && !b.elements.includes(elementFiltre)) return false
    if (mecaniqueFiltre && !b.mecaniques.includes(mecaniqueFiltre)) return false
    if (roleFiltre && !b.roles.includes(roleFiltre)) return false
    return true
  }

  const classesAffichees = filtreActif
    ? classesDisponibles().filter((c) => buildsPourClasse(c).some(buildCorrespondAuFiltre))
    : classesDisponibles()

  const sousClassesDeLaClasseBrutes = classe ? sousClassesPourClasse(classe) : []
  const sousClassesDeLaClasse = filtreActif
    ? sousClassesDeLaClasseBrutes.filter((sc) =>
        buildsPourClasseEtSousClasse(classe, sc.nom).some(buildCorrespondAuFiltre),
      )
    : sousClassesDeLaClasseBrutes

  const candidatsBruts = classe && sousClasse ? buildsPourClasseEtSousClasse(classe, sousClasse) : []
  const candidats = filtreActif ? candidatsBruts.filter(buildCorrespondAuFiltre) : candidatsBruts

  const nbBuildsPourElement = elementFiltre
    ? builds.filter((b) => b.elements.includes(elementFiltre)).length
    : 0
  const noteElementFaible =
    elementFiltre && nbBuildsPourElement <= 2 ? NOTE_ELEMENT_FAIBLE[elementFiltre] : undefined

  function fermer() {
    setOuvert(false)
    setClasse(buildActuel?.classe ?? '')
    setSousClasse(buildActuel?.sousClasse ?? '')
    setElementFiltre(null)
    setMecaniqueFiltre(null)
    setRoleFiltre(null)
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left active:bg-surface-raised"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-soft/50 bg-gold/10 text-gold">
          {buildActuel ? (
            <ClasseIcon classe={buildActuel.classe} className="h-4.5 w-4.5" />
          ) : (
            <span className="text-lg leading-none text-ink-muted">?</span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">
            {buildActuel ? buildActuel.nom : 'Aucun build choisi'}
          </span>
          {buildActuel && (
            <span className="block truncate text-xs text-ink-muted">
              {buildActuel.classe} · {buildActuel.sousClasse}
            </span>
          )}
        </span>
        <span className="shrink-0 rounded-full border border-glow/60 bg-glow/10 px-2.5 py-1 text-[11px] font-medium text-glow">
          Changer
        </span>
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={fermer}
          className="flex items-center gap-1 text-xs text-ink-muted"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Annuler
        </button>
        <button
          type="button"
          onClick={() => {
            onChoisir(null)
            setOuvert(false)
          }}
          className="rounded-full border border-border px-2.5 py-1 text-[11px] text-ink-muted"
        >
          Retirer le build
        </button>
      </div>

      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
        Direction élémentaire (optionnel)
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {elementsDisponibles.map((el) => (
          <button
            key={el}
            type="button"
            onClick={() => {
              setElementFiltre((actuel) => (actuel === el ? null : el))
              setClasse('')
              setSousClasse('')
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              elementFiltre === el
                ? 'border-glow/70 bg-glow/15 text-glow'
                : 'border-border text-ink-muted'
            }`}
          >
            {LABELS_ELEMENT[el]}
          </button>
        ))}
      </div>

      {elementFiltre && nbBuildsPourElement <= 2 && (
        <p className="mb-3 rounded-lg border border-glow/30 bg-glow/5 px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
          {noteElementFaible ??
            `Peu de builds misent sur ${LABELS_ELEMENT[elementFiltre]} dans le catalogue actuel — ce n'est pas forcément un oubli, certains dégâts sont juste peu représentés en sorts/objets dédiés dans BG3.`}
        </p>
      )}

      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
        Rôle et mécanique (optionnel)
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {rolesDisponibles.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setRoleFiltre((actuel) => (actuel === r ? null : r))
              setClasse('')
              setSousClasse('')
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              roleFiltre === r ? 'border-glow/70 bg-glow/15 text-glow' : 'border-border text-ink-muted'
            }`}
          >
            {LABELS_ROLE[r]}
          </button>
        ))}
        {mecaniquesDisponibles.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMecaniqueFiltre((actuel) => (actuel === m ? null : m))
              setClasse('')
              setSousClasse('')
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              mecaniqueFiltre === m ? 'border-glow/70 bg-glow/15 text-glow' : 'border-border text-ink-muted'
            }`}
          >
            {LABELS_MECANIQUE[m]}
          </button>
        ))}
      </div>

      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">Classe</p>
      {classesAffichees.length === 0 ? (
        <p className="mb-3 rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-xs text-ink-muted">
          Aucun build ne correspond à ces filtres pour l'instant.
        </p>
      ) : (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {classesAffichees.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setClasse(c)
                setSousClasse('')
              }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                classe === c ? 'border-glow/70 bg-glow/15 text-glow' : 'border-border text-ink-muted'
              }`}
            >
              <ClasseIcon classe={c} className="h-3.5 w-3.5" />
              {c}
            </button>
          ))}
        </div>
      )}

      {classe && (
        <>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
            Sous-classe
          </p>
          <div className="mb-3 flex flex-col gap-2">
            {sousClassesDeLaClasse.map((sc) => (
              <SousClasseCard
                key={sc.nom}
                sousClasse={sc}
                selectionnee={sousClasse === sc.nom}
                onSelect={() => setSousClasse(sc.nom)}
              />
            ))}
          </div>
        </>
      )}

      {classe && sousClasse && (
        <>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
            Build
          </p>
          {candidats.length > 0 ? (
            <div className="flex flex-col gap-2">
              {candidats.map((b) => (
                <BuildCandidatCard
                  key={b.id}
                  build={b}
                  selectionne={buildIdActuel === b.id}
                  onSelect={() => {
                    onChoisir(b)
                    setOuvert(false)
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-xs text-ink-muted">
              Pas encore de build détaillé pour cette sous-classe.
            </p>
          )}
        </>
      )}
    </div>
  )
}
