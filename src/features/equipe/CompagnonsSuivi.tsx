import { Link, useNavigate } from 'react-router-dom'
import { Section } from '../../components/Section'
import { Check, Plus } from '../../components/icons'
import { COMPAGNONS } from './composeurEquipe'
import { saveStore } from '../../storage/useSaveData'
import type { Campagne } from '../../storage/useSaveData'

export function CompagnonsSuivi({ campagne }: { campagne: Campagne }) {
  const navigate = useNavigate()
  const recrutes = campagne.compagnonsRecrutes

  return (
    <Section title={`Compagnons de l'histoire — ${recrutes.length}/${COMPAGNONS.length} recrutés`}>
      <div className="flex flex-col gap-2">
        {COMPAGNONS.map((c) => {
          const estRecrute = recrutes.includes(c.nom)
          const personnageLie = campagne.personnages.find((p) => p.compagnonNom === c.nom)
          return (
            <div
              key={c.nom}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
            >
              <button
                type="button"
                onClick={() => saveStore.basculerCompagnonRecrute(campagne.id, c.nom)}
                aria-label={estRecrute ? 'Marquer non recruté' : 'Marquer recruté'}
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                  estRecrute ? 'border-bon bg-bon/20 text-bon' : 'border-border text-ink-muted'
                }`}
              >
                {estRecrute && <Check className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${estRecrute ? 'text-ink-muted line-through' : 'text-ink'}`}>
                  {c.nom}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {c.sousRace ?? c.race} · {c.classeDefaut}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-ink-muted">{c.acte}</p>
              </div>
              {personnageLie ? (
                <Link
                  to={`/equipe/${personnageLie.id}`}
                  className="mt-0.5 shrink-0 rounded-full border border-glow/40 bg-glow/10 px-2.5 py-1 text-[11px] font-medium text-glow"
                >
                  Voir la fiche
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const id = saveStore.creerPersonnage(campagne.id, c.nom, {
                      race: c.race,
                      sousRace: c.sousRace ?? null,
                      compagnonNom: c.nom,
                    })
                    navigate(`/equipe/${id}`)
                  }}
                  aria-label={`Ajouter ${c.nom} au groupe`}
                  className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full border border-glow/60 bg-glow/10 px-2.5 py-1 text-[11px] font-medium text-glow"
                >
                  <Plus className="h-3 w-3" />
                  Groupe
                </button>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}
