import { useState } from 'react'
import { Plus } from '../../components/icons'
import { buildsPourClasseEtSousClasse, classesDisponibles, races, sousClassesPourClasse } from '../../data'
import { saveStore, type StyleJeu } from '../../storage/useSaveData'
import { SousClasseCard } from './SousClasseCard'
import { BuildCandidatCard } from './BuildCandidatCard'

const champSelect =
  'w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-ink focus:border-gold-soft focus:outline-none'

const stylesJeu: { valeur: StyleJeu; label: string }[] = [
  { valeur: null, label: 'Peu importe' },
  { valeur: 'bienveillant', label: 'Bienveillant' },
  { valeur: 'neutre', label: 'Neutre / gris' },
]

export function NouveauPersonnageForm({ campagneId }: { campagneId: string }) {
  const [ouvert, setOuvert] = useState(false)
  const [nom, setNom] = useState('')
  const [styleJeu, setStyleJeu] = useState<StyleJeu>(null)
  const [classe, setClasse] = useState('')
  const [sousClasse, setSousClasse] = useState('')
  const [buildId, setBuildId] = useState('')
  const [race, setRace] = useState('')
  const [sousRace, setSousRace] = useState('')

  const sousClassesDeLaClasse = classe ? sousClassesPourClasse(classe) : []
  const candidats =
    classe && sousClasse ? buildsPourClasseEtSousClasse(classe, sousClasse) : []
  const raceInfo = races.find((r) => r.nom === race)

  function reinitialiser() {
    setNom('')
    setClasse('')
    setSousClasse('')
    setBuildId('')
    setRace('')
    setSousRace('')
    setOuvert(false)
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm text-ink-muted active:bg-surface"
      >
        <Plus className="h-4 w-4" />
        Nouveau personnage
      </button>
    )
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault()
        const valeur = nom.trim()
        if (!valeur) return
        saveStore.creerPersonnage(campagneId, valeur, {
          classe: classe || null,
          sousClasse: sousClasse || null,
          buildId: buildId || null,
          race: race || null,
          sousRace: sousRace || null,
          styleJeu,
        })
        reinitialiser()
      }}
    >
      <input
        autoFocus
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Nom du personnage"
        className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-gold-soft focus:outline-none"
      />

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Style de jeu (optionnel)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {stylesJeu.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setStyleJeu(s.valeur)}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                styleJeu === s.valeur
                  ? 'border-gold-soft bg-gold/15 text-gold'
                  : 'border-border text-ink-muted'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-ink-muted">
          Sert juste à repérer les objets qui demandent un choix sombre — rien n'est jamais caché.
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Race (optionnel)
        </p>
        <select
          value={race}
          onChange={(e) => {
            setRace(e.target.value)
            setSousRace('')
          }}
          className={champSelect}
        >
          <option value="">Peu importe</option>
          {races.map((r) => (
            <option key={r.nom} value={r.nom}>
              {r.nom}
            </option>
          ))}
        </select>
        {raceInfo?.sousRaces && (
          <select
            value={sousRace}
            onChange={(e) => setSousRace(e.target.value)}
            className={`mt-2 ${champSelect}`}
          >
            <option value="">Sous-race — peu importe</option>
            {raceInfo.sousRaces.map((sr) => (
              <option key={sr.nom} value={sr.nom}>
                {sr.nom}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
          1. Quelle classe ?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {classesDisponibles().map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setClasse(c)
                setSousClasse('')
                setBuildId('')
              }}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                classe === c
                  ? 'border-gold-soft bg-gold/15 text-gold'
                  : 'border-border text-ink-muted'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {classe && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
            2. Quelle sous-classe ? — qu'est-ce que {nom.trim() || 'ton personnage'} va faire ?
          </p>
          <div className="flex flex-col gap-2">
            {sousClassesDeLaClasse.map((sc) => (
              <SousClasseCard
                key={sc.nom}
                sousClasse={sc}
                selectionnee={sousClasse === sc.nom}
                onSelect={() => {
                  setSousClasse(sc.nom)
                  setBuildId('')
                }}
              />
            ))}
          </div>
        </div>
      )}

      {classe && sousClasse && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
            3. Quel build pour ça ?
          </p>
          {candidats.length > 0 ? (
            <div className="flex flex-col gap-2">
              {candidats.map((b) => (
                <BuildCandidatCard
                  key={b.id}
                  build={b}
                  selectionne={buildId === b.id}
                  onSelect={() => setBuildId(b.id)}
                />
              ))}
              <button
                type="button"
                onClick={() => setBuildId('')}
                className={`rounded-lg border p-2.5 text-left text-sm transition-colors ${
                  buildId === ''
                    ? 'border-gold-soft bg-gold/10 text-ink'
                    : 'border-border bg-surface-raised text-ink-muted'
                }`}
              >
                Choisir plus tard
              </button>
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-xs text-ink-muted">
              Je n'ai pas encore de build détaillé pour cette sous-classe. Tu peux quand même
              créer {nom.trim() || 'ton personnage'} avec cette classe et cette sous-classe — je
              lui proposerai un build dès que j'en aurai un.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={reinitialiser}
          className="flex-1 rounded-lg border border-border py-2.5 text-sm text-ink-muted"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!nom.trim()}
          className="flex-1 rounded-lg bg-gold py-2.5 text-sm font-medium text-bg disabled:opacity-40"
        >
          Ajouter
        </button>
      </div>
    </form>
  )
}
