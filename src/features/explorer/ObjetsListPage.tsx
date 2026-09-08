import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { ChevronDown, Filter, Search } from '../../components/icons'
import { objets, nomAffiche, categorieObjet, type CategorieObjet } from '../../data'
import { ObjetCard } from './ObjetCard'

const CATEGORIES: CategorieObjet[] = [
  'Arme',
  'Armure',
  'Tête',
  'Amulette',
  'Anneau',
  'Gants',
  'Bottes',
  'Cape',
  'Bouclier',
  'Bonus permanent',
  'Objet clé',
  'Autre',
]

const ORDRE_RARETE = ['Commun', 'Peu commun', 'Rare', 'Très rare', 'Légendaire', 'Unique', 'Variable']
const RARETES = ORDRE_RARETE.filter((r) => objets.some((o) => o.rarete === r))
const ACTES = [1, 2, 3]

function ChipsFiltre<T extends string | number>({
  label,
  options,
  actif,
  onChange,
  rendreLabel,
}: {
  label: string
  options: T[]
  actif: T | null
  onChange: (valeur: T | null) => void
  rendreLabel?: (v: T) => string
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(actif === o ? null : o)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              actif === o ? 'border-glow/70 bg-glow/15 text-glow' : 'border-border text-ink-muted'
            }`}
          >
            {rendreLabel ? rendreLabel(o) : o}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ObjetsListPage() {
  const [recherche, setRecherche] = useState('')
  const [categorieActive, setCategorieActive] = useState<CategorieObjet | null>(null)
  const [rareteActive, setRareteActive] = useState<string | null>(null)
  const [acteActif, setActeActif] = useState<number | null>(null)
  const [filtresOuverts, setFiltresOuverts] = useState(false)

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return objets
      .filter((o) => (categorieActive ? categorieObjet(o) === categorieActive : true))
      .filter((o) => (rareteActive ? o.rarete === rareteActive : true))
      .filter((o) => (acteActif ? o.acte === acteActif : true))
      .filter((o) => {
        if (!q) return true
        return [nomAffiche(o), o.type, o.zone].some((champ) => champ.toLowerCase().includes(q))
      })
  }, [recherche, categorieActive, rareteActive, acteActif])

  const nbFiltresActifs = [categorieActive, rareteActive, acteActif].filter((v) => v !== null).length

  return (
    <div>
      <PageHeader title="Explorer" subtitle={`${objets.length} objets référencés`}>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un objet, une zone…"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-glow focus:outline-none"
          />
        </label>
      </PageHeader>

      <div className="border-b border-border px-4 py-2.5">
        <button
          type="button"
          onClick={() => setFiltresOuverts((v) => !v)}
          aria-expanded={filtresOuverts}
          className="flex w-full items-center justify-between gap-2 text-sm text-ink-muted"
        >
          <span className="flex items-center gap-1.5">
            <Filter className="h-4 w-4" />
            Filtres
            {nbFiltresActifs > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-glow/15 px-1.5 text-[11px] font-medium text-glow">
                {nbFiltresActifs}
              </span>
            )}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${filtresOuverts ? 'rotate-180' : ''}`} />
        </button>

        {filtresOuverts && (
          <div className="mt-3 flex flex-col gap-3">
            <ChipsFiltre label="Catégorie" options={CATEGORIES} actif={categorieActive} onChange={setCategorieActive} />
            <div className="flex gap-4">
              <div className="flex-1">
                <ChipsFiltre label="Rareté" options={RARETES} actif={rareteActive} onChange={setRareteActive} />
              </div>
              <div>
                <ChipsFiltre
                  label="Acte"
                  options={ACTES}
                  actif={acteActif}
                  onChange={setActeActif}
                  rendreLabel={(a) => String(a)}
                />
              </div>
            </div>
            {nbFiltresActifs > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCategorieActive(null)
                  setRareteActive(null)
                  setActeActif(null)
                }}
                className="self-start text-xs font-medium text-glow underline underline-offset-2"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {resultats.map((objet) => (
          <ObjetCard key={objet.id} objet={objet} />
        ))}
        {resultats.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-muted">Aucun objet ne correspond.</p>
        )}
      </div>
    </div>
  )
}
