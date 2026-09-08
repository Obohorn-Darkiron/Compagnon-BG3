import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { RotateCcw, Sparkles, Trash } from '../../components/icons'
import { saveStore, useSaveData } from '../../storage/useSaveData'
import { detacherSessionsPourCampagnes } from '../../session/sessionSync'
import { GroupeApercu } from './GroupeApercu'
import { CompagnonsSuivi } from './CompagnonsSuivi'
import { SessionSection } from './SessionSection'
import { SessionLobby } from './SessionLobby'
import { PersonnagesListe } from './PersonnagesListe'
import type { Campagne } from '../../storage/useSaveData'

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

function ReinitialiserProgressionButton({ campagne }: { campagne: Campagne }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (
          !confirm(
            `Réinitialiser la progression de "${campagne.nom}" ?\n\nLes objets cochés, les jalons Dark Urge et les compagnons recrutés repartent à zéro. Tes personnages, leurs niveaux et leurs builds restent inchangés — pratique pour relancer la même campagne depuis le début.\n\n(Si vous jouez en groupe, seuls tes propres personnages sont concernés.)`,
          )
        ) {
          return
        }
        saveStore.reinitialiserProgressionCampagne(campagne.id)
      }}
      aria-label="Réinitialiser la progression de cette campagne"
      title="Réinitialiser la progression (objets cochés, compagnons recrutés...)"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-ink-muted active:bg-surface"
    >
      <RotateCcw className="h-3.5 w-3.5" />
    </button>
  )
}

function SupprimerCampagneButton({ campagne }: { campagne: Campagne }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (
          !confirm(`Supprimer la campagne "${campagne.nom}" et ses ${campagne.personnages.length} personnage(s) ?`)
        ) {
          return
        }
        // Détache localement une éventuelle session de groupe (sans y toucher côté Firebase) : un
        // personnage de coéquipier peut être retiré manuellement par n'importe qui si besoin, ou
        // récupéré en revenant plus tard avec le même code.
        detacherSessionsPourCampagnes([campagne.id])
        saveStore.supprimerCampagne(campagne.id)
      }}
      aria-label="Supprimer cette campagne"
      title="Supprimer cette campagne"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-essentiel/40 text-essentiel active:bg-essentiel/10"
    >
      <Trash className="h-3.5 w-3.5" />
    </button>
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
        action={
          <div className="flex items-center gap-1.5">
            <SelecteurCampagne campagneActiveId={campagneActive.id} />
            <ReinitialiserProgressionButton campagne={campagneActive} />
            <SupprimerCampagneButton campagne={campagneActive} />
          </div>
        }
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

      {campagneActive.sessionCode &&
      campagneActive.sessionTailleMax !== null &&
      !campagneActive.sessionConfirmee ? (
        <SessionLobby campagne={campagneActive} />
      ) : (
        <>
          <GroupeApercu campagne={campagneActive} />
          <PersonnagesListe campagne={campagneActive} />
          <CompagnonsSuivi campagne={campagneActive} />
          <div className="pb-6" />
        </>
      )}
    </div>
  )
}
