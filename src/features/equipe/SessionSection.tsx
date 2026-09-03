import { useState } from 'react'
import { Section } from '../../components/Section'
import type { Campagne } from '../../storage/useSaveData'
import {
  creerSession,
  quitterSession,
  rejoindreSession,
  supprimerSessionEtQuitter,
} from '../../session/sessionSync'
import { sessionDisponible } from '../../session/firebaseClient'

export function SessionSection({ campagne }: { campagne: Campagne }) {
  const [codeSaisi, setCodeSaisi] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)

  if (!sessionDisponible) {
    return (
      <Section title="Session de groupe">
        <p className="rounded-lg border border-border bg-surface px-3 py-2.5 text-xs text-ink-muted">
          Cette fonctionnalité n'est pas encore configurée côté serveur — elle arrive bientôt.
        </p>
      </Section>
    )
  }

  if (campagne.sessionCode) {
    const nbJoueurs = new Set(
      campagne.personnages.map((p) => p.proprietaireId).filter((id): id is string => id !== null),
    ).size

    return (
      <Section title="Session de groupe">
        <div className="rounded-lg border border-glow/40 bg-glow/10 px-3 py-3">
          <p className="text-xs text-ink-muted">
            Partage ce code à tes amis pour qu'ils rejoignent la même partie :
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex-1 rounded-lg bg-surface px-3 py-2 text-center font-title text-2xl font-bold tracking-[0.3em] text-glow">
              {campagne.sessionCode}
            </span>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(campagne.sessionCode!)
                setCopie(true)
                setTimeout(() => setCopie(false), 1500)
              }}
              className="shrink-0 rounded-lg border border-glow/40 px-3 py-2 text-xs font-medium text-glow"
            >
              {copie ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {nbJoueurs <= 1
              ? "Toi seul(e) pour l'instant."
              : `${nbJoueurs} joueurs connectés à cette session.`}
          </p>
        </div>
        {erreur && <p className="mt-2 text-xs text-essentiel">{erreur}</p>}
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            disabled={enCours}
            onClick={() => {
              setEnCours(true)
              void quitterSession(campagne.id).finally(() => setEnCours(false))
            }}
            className="w-full rounded-lg border border-essentiel/40 py-2 text-xs text-essentiel disabled:opacity-40"
          >
            Quitter la session
          </button>
          {campagne.sessionEstProprietaire && (
            <button
              type="button"
              disabled={enCours}
              onClick={() => {
                if (
                  !confirm(
                    "Supprimer cette session pour tout le monde ? Les autres joueurs seront déconnectés et perdront le lien de synchronisation.",
                  )
                ) {
                  return
                }
                setEnCours(true)
                setErreur(null)
                void supprimerSessionEtQuitter(campagne.id, campagne.sessionCode!).then((resultat) => {
                  setEnCours(false)
                  if (!resultat.ok) setErreur(resultat.erreur)
                })
              }}
              className="w-full rounded-lg border border-essentiel bg-essentiel/10 py-2 text-xs font-medium text-essentiel disabled:opacity-40"
            >
              Supprimer la session pour tout le monde
            </button>
          )}
          {!campagne.sessionEstProprietaire && (
            <p className="text-center text-[11px] text-ink-muted">
              Seul le créateur de la session peut la supprimer pour tout le monde.
            </p>
          )}
        </div>
      </Section>
    )
  }

  return (
    <Section title="Session de groupe">
      <p className="mb-2 text-xs leading-relaxed text-ink-muted">
        Rejoignez-vous à plusieurs (jusqu'à 4 joueurs) avec un code partagé : chacun voit les
        builds des autres et l'app repère automatiquement les objets convoités par plusieurs
        d'entre vous.
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={enCours}
          onClick={async () => {
            setEnCours(true)
            setErreur(null)
            const resultat = await creerSession(campagne.id)
            setEnCours(false)
            if (!resultat.ok) setErreur(resultat.erreur)
          }}
          className="rounded-lg border border-glow/60 bg-glow/10 py-2.5 text-sm font-medium text-glow disabled:opacity-40"
        >
          Créer une session de groupe
        </button>
        <form
          className="flex items-center gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            setEnCours(true)
            setErreur(null)
            const resultat = await rejoindreSession(campagne.id, codeSaisi)
            setEnCours(false)
            if (!resultat.ok) setErreur(resultat.erreur)
            else setCodeSaisi('')
          }}
        >
          <input
            value={codeSaisi}
            onChange={(e) => setCodeSaisi(e.target.value.toUpperCase())}
            placeholder="Code à 6 caractères"
            maxLength={6}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm uppercase tracking-widest text-ink placeholder:text-ink-muted placeholder:normal-case placeholder:tracking-normal focus:border-glow focus:outline-none"
          />
          <button
            type="submit"
            disabled={enCours || !codeSaisi.trim()}
            className="shrink-0 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-ink disabled:opacity-40"
          >
            Rejoindre
          </button>
        </form>
        {erreur && <p className="text-xs text-essentiel">{erreur}</p>}
      </div>
    </Section>
  )
}
