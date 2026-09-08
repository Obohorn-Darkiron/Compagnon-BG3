import { useState } from 'react'
import { Section } from '../../components/Section'
import { Check } from '../../components/icons'
import { saveStore } from '../../storage/useSaveData'
import { lireJoueurId } from '../../storage/identite'
import type { Campagne, JoueurSession } from '../../storage/useSaveData'
import { confirmerGroupe } from '../../session/sessionSync'
import { builds } from '../../data'
import { PersonnagesListe } from './PersonnagesListe'
import { GroupeApercu } from './GroupeApercu'

/** Un joueur "prêt" sans aucun personnage créé (cas limite : personnage supprimé après coche)
 * ne compte pas comme réellement prêt — évite de bloquer le groupe sur un roster incohérent. */
function estReellementPret(campagne: Campagne, joueur: JoueurSession): boolean {
  return joueur.pret && campagne.personnages.some((p) => p.proprietaireId === joueur.joueurId)
}

function LigneJoueur({
  campagne,
  numero,
  joueur,
  estMoi,
}: {
  campagne: Campagne
  numero: number
  joueur: JoueurSession | undefined
  estMoi: boolean
}) {
  const [nomEdite, setNomEdite] = useState(joueur?.nom ?? '')
  const persosDuJoueur = joueur
    ? campagne.personnages.filter((p) => p.proprietaireId === joueur.joueurId)
    : []

  if (!joueur) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-ink-muted">
          J{numero}
        </span>
        <p className="text-xs text-ink-muted">En attente d'un joueur…</p>
      </div>
    )
  }

  const pret = estReellementPret(campagne, joueur)

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
            pret ? 'border-bon bg-bon/15 text-bon' : 'border-gold-soft text-gold'
          }`}
        >
          J{numero}
        </span>
        {estMoi ? (
          <input
            value={nomEdite}
            onChange={(e) => setNomEdite(e.target.value)}
            onBlur={() => {
              const valeur = nomEdite.trim()
              if (valeur && valeur !== joueur.nom) saveStore.definirMonJoueurSession(campagne.id, { nom: valeur })
              else setNomEdite(joueur.nom)
            }}
            maxLength={24}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-sm font-medium text-ink focus:border-glow focus:outline-none"
          />
        ) : (
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{joueur.nom}</p>
        )}
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
            pret ? 'border-bon bg-bon/20 text-bon' : 'border-border text-ink-muted'
          }`}
          aria-label={pret ? 'Prêt' : 'Pas encore prêt'}
        >
          {pret && <Check className="h-3.5 w-3.5" />}
        </span>
      </div>
      <div className="mt-1.5 pl-9">
        {persosDuJoueur.length === 0 ? (
          <p className="text-[11px] text-ink-muted">Personnage pas encore créé.</p>
        ) : (
          persosDuJoueur.map((p) => {
            const build = builds.find((b) => b.id === p.buildId)
            return (
              <p key={p.id} className="text-[11px] text-ink-muted">
                <span className="text-ink">{p.nom}</span> — {build ? build.nom : 'build à définir'}
              </p>
            )
          })
        )}
      </div>
    </div>
  )
}

export function SessionLobby({ campagne }: { campagne: Campagne }) {
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const monId = lireJoueurId()
  const monJoueur = campagne.sessionJoueurs.find((j) => j.joueurId === monId)
  const mesPersonnages = campagne.personnages.filter((p) => p.proprietaireId === monId)
  const tailleMax = campagne.sessionTailleMax ?? campagne.sessionJoueurs.length
  const numeros = Array.from({ length: tailleMax }, (_, i) => i + 1)
  const toutLeMondePret =
    campagne.sessionJoueurs.length > 0 &&
    campagne.sessionJoueurs.every((j) => estReellementPret(campagne, j))

  return (
    <div>
      <Section title="Lobby — en attente du groupe">
        <p className="mb-3 text-xs leading-relaxed text-ink-muted">
          Choisissez vos personnages et vos builds — vous voyez les choix des autres en direct.
          Coche "Je suis prêt" quand tu as fini, {campagne.sessionEstProprietaire ? "puis lance la partie une fois tout le monde prêt." : "l'hôte lance la partie une fois tout le monde prêt."}
        </p>
        <div className="flex flex-col gap-2">
          {numeros.map((n) => (
            <LigneJoueur
              key={n}
              campagne={campagne}
              numero={n}
              joueur={campagne.sessionJoueurs.find((j) => j.numero === n)}
              estMoi={campagne.sessionJoueurs.find((j) => j.numero === n)?.joueurId === monId}
            />
          ))}
        </div>

        {monJoueur && (
          <>
            <button
              type="button"
              disabled={mesPersonnages.length === 0 && !monJoueur.pret}
              onClick={() => saveStore.definirMonJoueurSession(campagne.id, { pret: !monJoueur.pret })}
              className={`mt-3 w-full rounded-lg border py-2.5 text-sm font-medium transition-colors disabled:opacity-40 ${
                monJoueur.pret
                  ? 'border-bon/60 bg-bon/10 text-bon'
                  : 'border-glow/60 bg-glow/10 text-glow'
              }`}
            >
              {monJoueur.pret ? '✓ Je suis prêt — annuler' : 'Je suis prêt'}
            </button>
            {mesPersonnages.length === 0 && (
              <p className="mt-1.5 text-center text-[11px] text-ink-muted">
                Crée d'abord ton personnage pour pouvoir te déclarer prêt.
              </p>
            )}
          </>
        )}
      </Section>

      <PersonnagesListe campagne={campagne} />

      <GroupeApercu campagne={campagne} />

      {campagne.sessionEstProprietaire && (
        <div className="px-4 pb-6">
          {erreur && <p className="mb-2 text-xs text-essentiel">{erreur}</p>}
          <button
            type="button"
            disabled={!toutLeMondePret || enCours}
            onClick={() => {
              setEnCours(true)
              setErreur(null)
              void confirmerGroupe(campagne.id).then((resultat) => {
                setEnCours(false)
                if (!resultat.ok) setErreur(resultat.erreur)
              })
            }}
            className="w-full rounded-lg bg-gold py-3 text-sm font-semibold text-bg disabled:opacity-40"
          >
            {toutLeMondePret ? 'Confirmer le groupe et lancer la partie' : 'En attente que tout le monde soit prêt…'}
          </button>
          <p className="mt-2 text-center text-[11px] text-ink-muted">
            Rien n'est verrouillé après — les builds resteront modifiables.
          </p>
        </div>
      )}
      {!campagne.sessionEstProprietaire && (
        <p className="px-4 pb-6 text-center text-xs text-ink-muted">
          {toutLeMondePret
            ? "Tout le monde est prêt — en attente que l'hôte lance la partie."
            : "En attente que tout le monde soit prêt."}
        </p>
      )}
    </div>
  )
}
