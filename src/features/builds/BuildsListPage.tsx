import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Search } from '../../components/icons'
import { builds, estMulticlasse, getObjet, nomAffiche } from '../../data'
import { BuildCard } from './BuildCard'

type FiltreClasse = 'tous' | 'mono' | 'multi'

const filtres: { valeur: FiltreClasse; label: string }[] = [
  { valeur: 'tous', label: 'Tous' },
  { valeur: 'mono', label: 'Mono-classe' },
  { valeur: 'multi', label: 'Multi-classe' },
]

export function BuildsListPage() {
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState<FiltreClasse>('tous')

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return builds
      .filter((b) => {
        if (filtre === 'mono') return !estMulticlasse(b)
        if (filtre === 'multi') return estMulticlasse(b)
        return true
      })
      .filter((b) => {
        if (!q) return true
        const nomsEquipement = b.equipement.map((e) => {
          const objet = getObjet(e.objetId)
          return objet ? nomAffiche(objet) : ''
        })
        const champs = [
          b.nom,
          b.classe,
          b.sousClasse,
          b.role,
          ...b.sortsCles,
          ...b.dons,
          ...nomsEquipement,
        ]
        return champs.some((champ) => champ.toLowerCase().includes(q))
      })
  }, [recherche, filtre])

  return (
    <div>
      <PageHeader title="Builds" subtitle={`${builds.length} builds disponibles`}>
        <div className="flex flex-col gap-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Classe, rôle, sort, don, objet…"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-glow focus:outline-none"
            />
          </label>

          <div className="flex gap-1.5">
            {filtres.map((f) => (
              <button
                key={f.valeur}
                type="button"
                onClick={() => setFiltre(f.valeur)}
                className={`flex-1 rounded-lg border px-2 py-3 text-xs font-medium transition-colors ${
                  filtre === f.valeur
                    ? 'border-glow/70 bg-glow/15 text-glow'
                    : 'border-border text-ink-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-3 px-4 py-4">
        {resultats.map((build) => (
          <BuildCard key={build.id} build={build} />
        ))}
        {resultats.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-muted">Aucun build ne correspond.</p>
        )}
      </div>
    </div>
  )
}
