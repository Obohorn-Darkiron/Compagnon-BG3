import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Sparkles } from '../../components/icons'
import { builds } from '../../data'
import { saveStore, useSaveData } from '../../storage/useSaveData'
import { lireJoueurId } from '../../storage/identite'
import { quitterSession } from '../../session/sessionSync'
import { NouveauPersonnageForm } from './NouveauPersonnageForm'
import { GroupeApercu } from './GroupeApercu'
import { CompagnonsSuivi } from './CompagnonsSuivi'
import { SessionSection } from './SessionSection'

function CreerCampagne() {
  const [nom, setNom] = useState('')

  return (
    <div className="px-4 py-8 text-center">
      <p className="mb-4 text-sm text-ink-muted">
        Crée ta première campagne pour commencer à suivre tes personnages.
      </p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const valeur = nom.trim()
          if (!valeur) return
          saveStore.creerCampagne(valeur)
        }}
      >
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex. Coop du samedi soir"
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-glow focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-gold px-3 py-2.5 text-sm font-medium text-bg disabled:opacity-40"
          disabled={!nom.trim()}
        >
          Créer la campagne
        </button>
      </form>
    </div>
  )
}

function SelecteurCampagne({ campagneActiveId }: { campagneActiveId: string }) {
  const data = useSaveData()
  const [nouvelle, setNouvelle] = useState(false)
  const [nom, setNom] = useState('')

  if (nouvelle) {
    return (
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault()
          const valeur = nom.trim()
          if (!valeur) return
          const id = saveStore.creerCampagne(valeur)
          saveStore.definirCampagneActive(id)
          setNom('')
          setNouvelle(false)
        }}
      >
        <input
          autoFocus
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom de la campagne"
          className="w-32 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:border-glow focus:outline-none"
        />
        <button type="submit" className="rounded-lg bg-gold px-2 py-1.5 text-xs font-medium text-bg">
          OK
        </button>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={campagneActiveId}
        onChange={(e) => saveStore.definirCampagneActive(e.target.value)}
        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-ink"
      >
        {data.campagnes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nom}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setNouvelle(true)}
        aria-label="Nouvelle campagne"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-ink-muted"
      >
        +
      </button>
    </div>
  )
}

export function EquipePage() {
  const data = useSaveData()
  const campagneActive =
    data.campagnes.find((c) => c.id === data.campagneActiveId) ?? data.campagnes[0]

  if (!campagneActive) {
    return (
      <div>
        <PageHeader title="Mon Groupe" />
        <CreerCampagne />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={campagneActive.nom}
        subtitle={`${campagneActive.personnages.length} personnage(s)`}
        action={<SelecteurCampagne campagneActiveId={campagneActive.id} />}
      />

      <div className="px-4 pt-4">
        <Link
          to="/equipe/builder"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-glow/60 bg-glow/10 py-2.5 text-sm font-medium text-glow active:bg-glow/15"
        >
          <Sparkles className="h-4 w-4" />
          Explorer des compositions d'équipe
        </Link>
      </div>

      <SessionSection campagne={campagneActive} />

      <GroupeApercu campagne={campagneActive} />

      <div className="flex flex-col gap-3 px-4 py-4">
        {campagneActive.personnages.map((perso) => {
          const build = builds.find((b) => b.id === perso.buildId)
          const estCoequipier = perso.proprietaireId !== null && perso.proprietaireId !== lireJoueurId()
          return (
            <Link
              key={perso.id}
              to={`/equipe/${perso.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 active:bg-surface-raised"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-title text-lg font-semibold text-ink">{perso.nom}</p>
                  {perso.compagnonNom && (
                    <span className="shrink-0 rounded-full border border-glow/40 bg-glow/10 px-1.5 py-0.5 text-[10px] font-medium text-glow">
                      Compagnon
                    </span>
                  )}
                  {estCoequipier && (
                    <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                      Coéquipier
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-ink-muted">
                  {build ? build.nom : 'Build à définir'}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-soft text-sm font-semibold text-gold">
                {perso.niveau}
              </div>
            </Link>
          )
        })}

        <NouveauPersonnageForm campagne={campagneActive} />
      </div>

      <CompagnonsSuivi campagne={campagneActive} />

      <div className="px-4 pb-6">
        <button
          type="button"
          onClick={async () => {
            if (
              !confirm(
                `Supprimer la campagne "${campagneActive.nom}" et ses ${campagneActive.personnages.length} personnage(s) ?`,
              )
            ) {
              return
            }
            // Quitte proprement une éventuelle session de groupe AVANT d'effacer la campagne :
            // sinon le personnage reste orphelin pour toujours côté Firebase (voir sessionSync).
            await quitterSession(campagneActive.id)
            saveStore.supprimerCampagne(campagneActive.id)
          }}
          className="w-full rounded-lg border border-essentiel/40 py-2.5 text-sm text-essentiel"
        >
          Supprimer cette campagne
        </button>
      </div>
    </div>
  )
}
