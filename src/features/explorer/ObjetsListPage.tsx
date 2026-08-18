import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Search } from '../../components/icons'
import { objets, nomAffiche } from '../../data'
import { ObjetCard } from './ObjetCard'

export function ObjetsListPage() {
  const [recherche, setRecherche] = useState('')

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    if (!q) return objets
    return objets.filter((o) =>
      [nomAffiche(o), o.type, o.zone].some((champ) => champ.toLowerCase().includes(q)),
    )
  }, [recherche])

  return (
    <div>
      <PageHeader title="Explorer" subtitle={`${objets.length} objets référencés`}>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un objet, une zone…"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-gold-soft focus:outline-none"
          />
        </label>
      </PageHeader>

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
