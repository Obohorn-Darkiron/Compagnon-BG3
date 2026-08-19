import { useState } from 'react'
import { Plus } from '../../components/icons'
import { buildsPourClasseEtSousClasse, classesDisponibles, races, sousClassesPourClasse } from '../../data'
import { saveStore, type Campagne, type StyleJeu } from '../../storage/useSaveData'
import { COMPAGNONS } from './composeurEquipe'
import { SousClasseCard } from './SousClasseCard'
import { BuildCandidatCard } from './BuildCandidatCard'

const champSelect =
  'w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-ink focus:border-glow focus:outline-none'

const stylesJeu: { valeur: StyleJeu; label: string }[] = [
  { valeur: null, label: 'Peu importe' },
  { valeur: 'bienveillant', label: 'Bienveillant' },
  { valeur: 'neutre', label: 'Neutre / gris' },
]

type TypePerso = 'libre' | 'compagnon'

export function NouveauPersonnageForm({ campagne }: { campagne: Campagne }) {
  const [ouvert, setOuvert] = useState(false)
  const [type, setType] = useState<TypePerso>('libre')
  const [compagnonNom, setCompagnonNom] = useState('')
  const [nom, setNom] = useState('')
  const [styleJeu, setStyleJeu] = useState<StyleJeu>(null)
  const [classe, setClasse] = useState('')
  const [sousClasse, setSousClasse] = useState('')
  const [buildId, setBuildId] = useState('')
  const [race, setRace] = useState('')
  const [sousRace, setSousRace] = useState('')

  const nomsDejaLies = new Set(
    campagne.personnages.map((p) => p.compagnonNom).filter((n): n is string => n !== null),
  )
  const compagnonsDisponibles = COMPAGNONS.filter((c) => !nomsDejaLies.has(c.nom))
  const compagnonChoisi = COMPAGNONS.find((c) => c.nom === compagnonNom)

  const sousClassesDeLaClasse = classe ? sousClassesPourClasse(classe) : []
  const candidats =
    classe && sousClasse ? buildsPourClasseEtSousClasse(classe, sousClasse) : []
  const raceInfo = races.find((r) => r.nom === (type === 'compagnon' ? compagnonChoisi?.race : race))

  function reinitialiser() {
    setType('libre')
    setCompagnonNom('')
    setNom('')
    setClasse('')
    setSousClasse('')
    setBuildId('')
    setRace('')
    setSousRace('')
    setOuvert(false)
  }

  function choisirCompagnon(nomChoisi: string) {
    const c = COMPAGNONS.find((x) => x.nom === nomChoisi)
    setCompagnonNom(nomChoisi)
    setNom(nomChoisi)
    setRace(c?.race ?? '')
    setSousRace(c?.sousRace ?? '')
    setClasse('')
    setSousClasse('')
    setBuildId('')
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

  const nomValide = type === 'libre' ? nom.trim().length > 0 : compagnonNom.length > 0

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!nomValide) return
        saveStore.creerPersonnage(campagne.id, type === 'compagnon' ? compagnonNom : nom.trim(), {
          classe: classe || null,
          sousClasse: sousClasse || null,
          buildId: buildId || null,
          race: race || null,
          sousRace: sousRace || null,
          styleJeu,
          compagnonNom: type === 'compagnon' ? compagnonNom : null,
        })
        reinitialiser()
      }}
    >
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Perso libre ou compagnon de l'histoire ?
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setType('libre')
              setCompagnonNom('')
              setNom('')
              setRace('')
              setSousRace('')
            }}
            className={`flex-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors ${
              type === 'libre' ? 'border-glow/70 bg-glow/15 text-glow' : 'border-border text-ink-muted'
            }`}
          >
            Personnage libre
          </button>
          <button
            type="button"
            onClick={() => setType('compagnon')}
            disabled={compagnonsDisponibles.length === 0}
            className={`flex-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors disabled:opacity-30 ${
              type === 'compagnon' ? 'border-glow/70 bg-glow/15 text-glow' : 'border-border text-ink-muted'
            }`}
          >
            Compagnon de l'histoire
          </button>
        </div>
        {type === 'compagnon' && compagnonsDisponibles.length === 0 && (
          <p className="mt-1.5 text-[11px] text-ink-muted">
            Les 10 compagnons de l'histoire sont déjà dans ce groupe.
          </p>
        )}
      </div>

      {type === 'libre' ? (
        <input
          autoFocus
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom du personnage"
          className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-glow focus:outline-none"
        />
      ) : (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
            Quel compagnon ?
          </p>
          <div className="flex flex-col gap-2">
            {compagnonsDisponibles.map((c) => (
              <button
                key={c.nom}
                type="button"
                onClick={() => choisirCompagnon(c.nom)}
                className={`rounded-lg border p-2.5 text-left transition-colors ${
                  compagnonNom === c.nom ? 'border-glow/70 bg-glow/10' : 'border-border bg-surface-raised'
                }`}
              >
                <p className="text-sm font-medium text-ink">{c.nom}</p>
                <p className="text-xs text-ink-muted">
                  {c.sousRace ?? c.race} · {c.classeDefaut} de base
                </p>
              </button>
            ))}
          </div>
          {compagnonChoisi && (
            <p className="mt-1.5 text-[11px] text-ink-muted">
              Sa race ({compagnonChoisi.sousRace ?? compagnonChoisi.race}) est fixe — seule la classe
              peut être changée (reclassage chez Withers).
            </p>
          )}
        </div>
      )}

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
                  ? 'border-glow/70 bg-glow/15 text-glow'
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

      {type === 'libre' && (
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
      )}

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
                  ? 'border-glow/70 bg-glow/15 text-glow'
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
                    ? 'border-glow/70 bg-glow/10 text-ink'
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
          disabled={!nomValide}
          className="flex-1 rounded-lg bg-gold py-2.5 text-sm font-medium text-bg disabled:opacity-40"
        >
          Ajouter
        </button>
      </div>
    </form>
  )
}
