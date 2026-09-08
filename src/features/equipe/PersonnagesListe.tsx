import { Link } from 'react-router-dom'
import { builds } from '../../data'
import { lireJoueurId } from '../../storage/identite'
import type { Campagne } from '../../storage/useSaveData'
import { retirerPersonnageDeSession } from '../../session/sessionSync'
import { NouveauPersonnageForm } from './NouveauPersonnageForm'

/** Liste des personnages d'une campagne, avec formulaire d'ajout — utilisée à la fois par la
 * page Groupe normale et par le lobby de session (choix de personnage/build en direct). */
export function PersonnagesListe({ campagne }: { campagne: Campagne }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {campagne.personnages.map((perso) => {
        const build = builds.find((b) => b.id === perso.buildId)
        const estCoequipier = perso.proprietaireId !== null && perso.proprietaireId !== lireJoueurId()
        return (
          <div key={perso.id} className="rounded-xl border border-border bg-surface">
            <Link
              to={`/equipe/${perso.id}`}
              className="flex items-center justify-between gap-3 p-4 active:bg-surface-raised"
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
                <p className="truncate text-sm text-ink-muted">{build ? build.nom : 'Build à définir'}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-soft text-sm font-semibold text-gold">
                {perso.niveau}
              </div>
            </Link>
            {estCoequipier && campagne.sessionCode && campagne.sessionEstProprietaire && (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Retirer ${perso.nom} de la session ? Utile si cette personne ne revient pas — elle pourra recréer son personnage si elle rejoint plus tard.`,
                    )
                  ) {
                    void retirerPersonnageDeSession(campagne.id, campagne.sessionCode!, perso.id)
                  }
                }}
                className="w-full border-t border-border py-2 text-xs text-essentiel"
              >
                Retirer de la session
              </button>
            )}
          </div>
        )
      })}

      <NouveauPersonnageForm campagne={campagne} />
    </div>
  )
}
