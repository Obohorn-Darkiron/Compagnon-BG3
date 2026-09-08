import { useState } from 'react'
import { Section } from '../../components/Section'
import { useConfirm } from '../../components/useConfirm'
import type { Campagne } from '../../storage/useSaveData'
import {
  creerSession,
  quitterSession,
  rejoindreSession,
  supprimerSessionEtQuitter,
} from '../../session/sessionSync'
import { sessionDisponible } from '../../session/firebaseClient'

const TAILLES = [2, 3, 4]

export function SessionSection({ campagne }: { campagne: Campagne }) {
  const [etapeCreation, setEtapeCreation] = useState(false)
  const [etapeRejoindre, setEtapeRejoindre] = useState(false)
  const [monNom, setMonNom] = useState('')
  const [taille, setTaille] = useState(4)
  const [codeSaisi, setCodeSaisi] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)
  const { confirmer, dialogue } = useConfirm()

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
    const nbJoueurs = campagne.sessionJoueurs.length

    return (
      <>
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
              : `${nbJoueurs} joueur(s) connecté(s)${
                  campagne.sessionTailleMax ? ` sur ${campagne.sessionTailleMax}` : ''
                }.`}
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
              onClick={async () => {
                const ok = await confirmer(
                  'Supprimer cette session pour tout le monde ? Les autres joueurs seront déconnectés et perdront le lien de synchronisation.',
                  { danger: true, confirmerLabel: 'Supprimer' },
                )
                if (!ok) return
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
      {dialogue}
      </>
    )
  }

  return (
    <Section title="Session de groupe">
      <p className="mb-2 text-xs leading-relaxed text-ink-muted">
        Rejoignez-vous à plusieurs (jusqu'à 4 joueurs) avec un code partagé : chacun voit les
        builds des autres en direct, avec un récap des synergies et des objets convoités par
        plusieurs d'entre vous avant de vous lancer.
      </p>

      {!etapeCreation && !etapeRejoindre && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setErreur(null)
              setEtapeCreation(true)
            }}
            className="rounded-lg border border-glow/60 bg-glow/10 py-2.5 text-sm font-medium text-glow disabled:opacity-40"
          >
            Créer une session de groupe
          </button>
          <button
            type="button"
            onClick={() => {
              setErreur(null)
              setEtapeRejoindre(true)
            }}
            className="rounded-lg border border-border py-2.5 text-sm font-medium text-ink"
          >
            Rejoindre avec un code
          </button>
        </div>
      )}

      {etapeCreation && (
        <form
          className="flex flex-col gap-2.5"
          onSubmit={async (e) => {
            e.preventDefault()
            setEnCours(true)
            setErreur(null)
            const resultat = await creerSession(campagne.id, taille, monNom)
            setEnCours(false)
            if (!resultat.ok) setErreur(resultat.erreur)
          }}
        >
          <input
            autoFocus
            value={monNom}
            onChange={(e) => setMonNom(e.target.value)}
            placeholder="Ton nom"
            maxLength={24}
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-glow focus:outline-none"
          />
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Combien de joueurs ?
            </p>
            <div className="flex gap-1.5">
              {TAILLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTaille(t)}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                    taille === t ? 'border-glow/70 bg-glow/15 text-glow' : 'border-border text-ink-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEtapeCreation(false)}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm text-ink-muted"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={enCours || !monNom.trim()}
              className="flex-1 rounded-lg bg-gold py-2.5 text-sm font-medium text-bg disabled:opacity-40"
            >
              Créer
            </button>
          </div>
          {erreur && <p className="text-xs text-essentiel">{erreur}</p>}
        </form>
      )}

      {etapeRejoindre && (
        <form
          className="flex flex-col gap-2.5"
          onSubmit={async (e) => {
            e.preventDefault()
            setEnCours(true)
            setErreur(null)
            const resultat = await rejoindreSession(campagne.id, codeSaisi, monNom)
            setEnCours(false)
            if (!resultat.ok) setErreur(resultat.erreur)
            else setCodeSaisi('')
          }}
        >
          <input
            autoFocus
            value={codeSaisi}
            onChange={(e) => setCodeSaisi(e.target.value.toUpperCase())}
            placeholder="Code à 6 caractères"
            maxLength={6}
            className="mb-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm uppercase tracking-widest text-ink placeholder:text-ink-muted placeholder:normal-case placeholder:tracking-normal focus:border-glow focus:outline-none"
          />
          <input
            value={monNom}
            onChange={(e) => setMonNom(e.target.value)}
            placeholder="Ton nom"
            maxLength={24}
            className="mb-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-glow focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEtapeRejoindre(false)}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm text-ink-muted"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={enCours || !codeSaisi.trim() || !monNom.trim()}
              className="flex-1 rounded-lg bg-gold py-2.5 text-sm font-medium text-bg disabled:opacity-40"
            >
              Rejoindre
            </button>
          </div>
          {erreur && <p className="text-xs text-essentiel">{erreur}</p>}
        </form>
      )}
    </Section>
  )
}
