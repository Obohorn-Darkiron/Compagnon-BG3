import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Section } from '../../components/Section'
import { builds, classesDisponibles, races } from '../../data'
import { saveStore, useSaveData, type Campagne } from '../../storage/useSaveData'
import {
  composerEquipe,
  LABELS_GENRE_GROUPE,
  LABELS_ROLE,
  type GenreGroupe,
  type PreferenceMulticlasse,
  type PreferenceSoin,
  type ResultatComposition,
  type StyleCombat,
} from './composeurEquipe'

const GENRES: { valeur: GenreGroupe; label: string; description: string }[] = [
  {
    valeur: 'equilibre',
    label: 'Équilibrée',
    description: 'Un tank, un soin, du contrôle, des dégâts — la base solide pour tout affronter.',
  },
  {
    valeur: 'offensif',
    label: 'Offensive',
    description: 'Peu de défense, un maximum de dégâts. On tue vite, avant de se faire toucher.',
  },
  {
    valeur: 'atypique',
    label: 'Atypique',
    description: 'Des sous-classes moins jouées, en évitant les choix les plus évidents.',
  },
]

const PREFERENCES_SOIN: { valeur: PreferenceSoin; label: string }[] = [
  { valeur: 'oui', label: 'Oui, un vrai soigneur' },
  { valeur: 'non', label: 'Non, on gère avec des potions/sorts' },
  { valeur: 'peu-importe', label: 'Peu importe' },
]

const STYLES_COMBAT: { valeur: StyleCombat; label: string }[] = [
  { valeur: 'melee', label: 'Plutôt au contact' },
  { valeur: 'distance', label: 'Plutôt à distance / magie' },
  { valeur: 'peu-importe', label: 'Peu importe' },
]

const PREFERENCES_MULTICLASSE: { valeur: PreferenceMulticlasse; label: string }[] = [
  { valeur: 'mono', label: 'Mono-classe, simple' },
  { valeur: 'multi', label: 'Multi-classé, ça ne me fait pas peur' },
  { valeur: 'peu-importe', label: 'Peu importe' },
]

const NB_JOUEURS: { valeur: number; label: string; description: string }[] = [
  { valeur: 1, label: 'Solo (1)', description: 'Un seul personnage à créer — les 3 autres seront des compagnons à recruter.' },
  { valeur: 2, label: 'Duo (2)', description: '2 personnages à créer, 2 compagnons à recruter.' },
  { valeur: 3, label: 'Trio (3)', description: '3 personnages à créer, 1 compagnon à recruter.' },
  { valeur: 4, label: 'Groupe complet (4)', description: 'Tout le monde crée son propre personnage.' },
]

function ChipMultiSelect({
  options,
  selectionnes,
  onToggle,
  maxSelection,
}: {
  options: string[]
  selectionnes: string[]
  onToggle: (valeur: string) => void
  maxSelection?: number
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const actif = selectionnes.includes(o)
        const desactive = !actif && maxSelection !== undefined && selectionnes.length >= maxSelection
        return (
          <button
            key={o}
            type="button"
            disabled={desactive}
            onClick={() => onToggle(o)}
            className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-30 ${
              actif ? 'border-gold-soft bg-gold/15 text-gold' : 'border-border text-ink-muted'
            }`}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

function CarteSlot({ slot, index }: { slot: ResultatComposition['slots'][number]; index: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Personnage {index + 1} · {slot.build.classe}
          </p>
          <Link
            to={`/builds/${slot.build.id}`}
            className="mt-0.5 block truncate text-base font-semibold text-gold underline underline-offset-2"
          >
            {slot.build.nom}
          </Link>
          <p className="mt-0.5 text-xs text-ink-muted">{slot.build.sousClasse}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            slot.typeSlot === 'compagnon'
              ? 'border-gold-soft bg-gold/10 text-gold'
              : 'border-bon/40 bg-bon/10 text-bon'
          }`}
        >
          {slot.typeSlot === 'compagnon' ? 'Compagnon' : 'Ton perso'}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {slot.build.roles.map((r) => (
          <span
            key={r}
            className="rounded-full border border-border bg-surface-raised px-2 py-0.5 text-[11px] text-ink-muted"
          >
            {LABELS_ROLE[r]}
          </span>
        ))}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-ink">{slot.raison}</p>

      {slot.compagnon && (
        <div className="mt-2 rounded-lg border border-glow/40 bg-glow/10 px-3 py-2.5">
          <p className="text-xs font-semibold text-glow">
            Recrute {slot.compagnon.nom} ({slot.compagnon.sousRace ?? slot.compagnon.race})
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink">
            {slot.compagnon.reclassageNecessaire ? (
              <>
                {slot.compagnon.nom} est {slot.compagnon.classeDefaut} de base — reclasse-le chez
                Withers (disponible dès l'Acte 1) en {slot.build.classe} pour obtenir ce profil.
              </>
            ) : (
              <>Aucun reclassage nécessaire — c'est déjà son profil de base.</>
            )}
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">{slot.compagnon.acte}</p>
        </div>
      )}
    </div>
  )
}

const champInput =
  'w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-gold-soft focus:outline-none'

function FormulaireCreation({
  resultat,
  campagnes,
  campagneActiveId,
}: {
  resultat: ResultatComposition
  campagnes: Campagne[]
  campagneActiveId: string | null
}) {
  const navigate = useNavigate()
  const nouveauxSlots = resultat.slots.filter((s) => !s.dejaExistant)

  const [noms, setNoms] = useState<string[]>(() =>
    nouveauxSlots.map((s) => s.compagnon?.nom ?? s.build.classe),
  )
  const [racesChoisies, setRacesChoisies] = useState<string[]>(() =>
    nouveauxSlots.map((s) => s.compagnon?.race ?? ''),
  )
  const [sousRacesChoisies, setSousRacesChoisies] = useState<string[]>(() =>
    nouveauxSlots.map((s) => s.compagnon?.sousRace ?? ''),
  )
  const [nouvelleCampagne, setNouvelleCampagne] = useState(campagnes.length === 0)
  const [nomCampagne, setNomCampagne] = useState('')
  const [campagneCibleId, setCampagneCibleId] = useState(campagneActiveId ?? campagnes[0]?.id ?? '')

  if (nouveauxSlots.length === 0) {
    return (
      <Section title="Ajouter au groupe">
        <p className="text-sm text-ink-muted">
          Tous ces personnages existent déjà dans ton groupe — rien à ajouter de plus.
        </p>
      </Section>
    )
  }

  function majListe(setter: (v: string[]) => void, liste: string[], index: number, valeur: string) {
    const copie = [...liste]
    copie[index] = valeur
    setter(copie)
  }

  const nomCampagneManquant = (nouvelleCampagne || campagnes.length === 0) && !nomCampagne.trim()

  function creer() {
    if (nomCampagneManquant) return
    let campagneId = campagneCibleId
    if (nouvelleCampagne || campagnes.length === 0) {
      campagneId = saveStore.creerCampagne(nomCampagne.trim())
    }
    saveStore.definirCampagneActive(campagneId)

    nouveauxSlots.forEach((slot, i) => {
      const raceInfo = races.find((r) => r.nom === racesChoisies[i])
      saveStore.creerPersonnage(campagneId, noms[i].trim() || slot.build.classe, {
        classe: slot.build.classe,
        sousClasse: slot.build.sousClasse,
        buildId: slot.build.id,
        race: racesChoisies[i] || null,
        sousRace: raceInfo?.sousRaces ? sousRacesChoisies[i] || null : null,
        styleJeu: null,
      })
    })

    navigate('/equipe')
  }

  return (
    <Section title="Ajouter au groupe">
      {campagnes.length > 0 && (
        <select
          value={nouvelleCampagne ? '__nouvelle__' : campagneCibleId}
          onChange={(e) => {
            if (e.target.value === '__nouvelle__') {
              setNouvelleCampagne(true)
            } else {
              setNouvelleCampagne(false)
              setCampagneCibleId(e.target.value)
            }
          }}
          className={champInput}
        >
          {campagnes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
          <option value="__nouvelle__">+ Nouvelle campagne</option>
        </select>
      )}

      {(nouvelleCampagne || campagnes.length === 0) && (
        <input
          value={nomCampagne}
          onChange={(e) => setNomCampagne(e.target.value)}
          placeholder="Nom de la nouvelle campagne"
          className={`mt-2 ${champInput}`}
        />
      )}

      <div className="mt-3 flex flex-col gap-3">
        {nouveauxSlots.map((slot, i) => {
          const raceInfo = races.find((r) => r.nom === racesChoisies[i])
          return (
            <div key={slot.build.id + i} className="rounded-lg border border-border bg-surface p-3">
              <p className="mb-1.5 text-xs text-ink-muted">
                {slot.compagnon ? 'Compagnon' : 'Ton perso'} · {slot.build.nom} · {slot.build.classe}
              </p>
              <input
                value={noms[i]}
                onChange={(e) => majListe(setNoms, noms, i, e.target.value)}
                placeholder="Nom du personnage"
                className={champInput}
              />
              <select
                value={racesChoisies[i]}
                onChange={(e) => {
                  majListe(setRacesChoisies, racesChoisies, i, e.target.value)
                  majListe(setSousRacesChoisies, sousRacesChoisies, i, '')
                }}
                className={`mt-2 ${champInput}`}
              >
                <option value="">Race — peu importe</option>
                {races.map((r) => (
                  <option key={r.nom} value={r.nom}>
                    {r.nom}
                  </option>
                ))}
              </select>
              {raceInfo?.sousRaces && (
                <select
                  value={sousRacesChoisies[i]}
                  onChange={(e) => majListe(setSousRacesChoisies, sousRacesChoisies, i, e.target.value)}
                  className={`mt-2 ${champInput}`}
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
          )
        })}
      </div>

      <button
        type="button"
        onClick={creer}
        disabled={nomCampagneManquant}
        className="mt-3 w-full rounded-lg bg-gold py-2.5 text-sm font-medium text-bg disabled:opacity-40"
      >
        Ajouter {nouveauxSlots.length} personnage{nouveauxSlots.length > 1 ? 's' : ''} au groupe
      </button>
    </Section>
  )
}

export function EquipeBuilderPage() {
  const data = useSaveData()
  const campagneActive = data.campagnes.find((c) => c.id === data.campagneActiveId) ?? data.campagnes[0]
  const personnagesAvecBuild = (campagneActive?.personnages ?? []).filter((p) => p.buildId)
  const builsFixesDisponibles = personnagesAvecBuild
    .slice(0, 3)
    .map((p) => builds.find((b) => b.id === p.buildId))
    .filter((b): b is NonNullable<typeof b> => Boolean(b))

  const [nbJoueurs, setNbJoueurs] = useState(4)
  const [genre, setGenre] = useState<GenreGroupe>('equilibre')
  const [preferenceSoin, setPreferenceSoin] = useState<PreferenceSoin>('peu-importe')
  const [styleCombat, setStyleCombat] = useState<StyleCombat>('peu-importe')
  const [multiclassage, setMulticlassage] = useState<PreferenceMulticlasse>('peu-importe')
  const [classesAInclure, setClassesAInclure] = useState<string[]>([])
  const [classesAEviter, setClassesAEviter] = useState<string[]>([])
  const [synergiesSurprenantes, setSynergiesSurprenantes] = useState(false)
  const [utiliserExistants, setUtiliserExistants] = useState(false)
  const [resultat, setResultat] = useState<ResultatComposition | null>(null)

  function basculer(liste: string[], setListe: (v: string[]) => void, valeur: string) {
    setListe(liste.includes(valeur) ? liste.filter((c) => c !== valeur) : [...liste, valeur])
  }

  return (
    <div>
      <PageHeader title="Composer une équipe" back="/equipe" />

      <div className="px-4 pt-3">
        <p className="text-sm leading-relaxed text-ink-muted">
          Un outil d'exploration indépendant de tes personnages : réponds à quelques questions, je te
          propose 4 personnages complémentaires — sans doublon de classe, sans qu'ils se battent pour
          le même objet, et en cherchant de vraies synergies mécaniques entre eux.
        </p>
      </div>

      <Section title="Solo ou multijoueur ?">
        <div className="flex flex-col gap-2">
          {NB_JOUEURS.map((n) => (
            <button
              key={n.valeur}
              type="button"
              onClick={() => setNbJoueurs(n.valeur)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                nbJoueurs === n.valeur ? 'border-gold-soft bg-gold/10' : 'border-border bg-surface'
              }`}
            >
              <p className={`text-sm font-medium ${nbJoueurs === n.valeur ? 'text-gold' : 'text-ink'}`}>
                {n.label}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">{n.description}</p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">
          En BG3, tu ne crées que tes propres personnages — les autres rôles sont tenus par des
          compagnons recrutables dans l'histoire (classe reclassable chez Withers, mais pas la race).
        </p>
      </Section>

      <Section title="Quel genre de groupe ?">
        <div className="flex flex-col gap-2">
          {GENRES.map((g) => (
            <button
              key={g.valeur}
              type="button"
              onClick={() => setGenre(g.valeur)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                genre === g.valeur ? 'border-gold-soft bg-gold/10' : 'border-border bg-surface'
              }`}
            >
              <p className={`text-sm font-medium ${genre === g.valeur ? 'text-gold' : 'text-ink'}`}>
                {g.label}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">{g.description}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Style de combat préféré">
        <div className="flex flex-wrap gap-1.5">
          {STYLES_COMBAT.map((s) => (
            <button
              key={s.valeur}
              type="button"
              onClick={() => setStyleCombat(s.valeur)}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                styleCombat === s.valeur ? 'border-gold-soft bg-gold/15 text-gold' : 'border-border text-ink-muted'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Un soigneur dédié dans le groupe ?">
        <div className="flex flex-wrap gap-1.5">
          {PREFERENCES_SOIN.map((p) => (
            <button
              key={p.valeur}
              type="button"
              onClick={() => setPreferenceSoin(p.valeur)}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                preferenceSoin === p.valeur ? 'border-gold-soft bg-gold/15 text-gold' : 'border-border text-ink-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Des builds multi-classés ?">
        <div className="flex flex-wrap gap-1.5">
          {PREFERENCES_MULTICLASSE.map((p) => (
            <button
              key={p.valeur}
              type="button"
              onClick={() => setMulticlassage(p.valeur)}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                multiclassage === p.valeur ? 'border-gold-soft bg-gold/15 text-gold' : 'border-border text-ink-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Des classes que tu veux absolument voir ? (optionnel, 3 max)">
        <ChipMultiSelect
          options={classesDisponibles()}
          selectionnes={classesAInclure}
          onToggle={(c) => basculer(classesAInclure, setClassesAInclure, c)}
          maxSelection={3}
        />
      </Section>

      <Section title="Des classes à éviter ? (optionnel)">
        <ChipMultiSelect
          options={classesDisponibles().filter((c) => !classesAInclure.includes(c))}
          selectionnes={classesAEviter}
          onToggle={(c) => basculer(classesAEviter, setClassesAEviter, c)}
        />
      </Section>

      <Section title="Compositions surprenantes ?">
        <button
          type="button"
          onClick={() => setSynergiesSurprenantes((v) => !v)}
          className={`w-full rounded-lg border p-3 text-left transition-colors ${
            synergiesSurprenantes ? 'border-gold-soft bg-gold/10' : 'border-border bg-surface'
          }`}
        >
          <p className={`text-sm font-medium ${synergiesSurprenantes ? 'text-gold' : 'text-ink'}`}>
            {synergiesSurprenantes ? '✓ ' : ''}Privilégier des associations inattendues mais très
            synergiques
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            Quitte à s'éloigner des picks les plus classiques, si une vraie mécanique de jeu les relie
            (contrôle + attaque sournoise, Ténèbres + mêlée, Hâte sur le DPS...).
          </p>
        </button>
      </Section>

      {builsFixesDisponibles.length > 0 && (
        <Section title="Point de départ (optionnel)">
          <button
            type="button"
            onClick={() => setUtiliserExistants((v) => !v)}
            className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
              utiliserExistants ? 'border-gold-soft bg-gold/10 text-ink' : 'border-border bg-surface text-ink-muted'
            }`}
          >
            <p className="font-medium">
              {utiliserExistants ? '✓ ' : ''}Fixer {campagneActive!.nom} comme base (
              {builsFixesDisponibles.length} personnage{builsFixesDisponibles.length > 1 ? 's' : ''})
            </p>
            <p className="mt-0.5 text-xs">Sinon je pars entièrement de zéro à partir de tes réponses.</p>
          </button>
        </Section>
      )}

      <div className="px-4 py-4">
        <button
          type="button"
          onClick={() =>
            setResultat(
              composerEquipe({
                builsFixes: utiliserExistants ? builsFixesDisponibles : [],
                genre,
                preferenceSoin,
                styleCombat,
                multiclassage,
                classesAInclure,
                classesAEviter,
                synergiesSurprenantes,
                nbJoueurs,
              }),
            )
          }
          className="w-full rounded-lg bg-gold py-2.5 text-sm font-medium text-bg"
        >
          Composer l'équipe
        </button>
      </div>

      {resultat && (
        <>
          <Section title={`Ton équipe — ${LABELS_GENRE_GROUPE[resultat.genre]}`}>
            <div className="flex flex-col gap-3">
              {resultat.slots.map((slot, i) => (
                <CarteSlot key={slot.build.id + i} slot={slot} index={i} />
              ))}
            </div>
          </Section>

          {resultat.synergies.length > 0 && (
            <Section title="Synergies détectées">
              <div className="flex flex-col gap-2">
                {resultat.synergies.map((s, i) => (
                  <div key={i} className="rounded-lg border border-bon/30 bg-surface px-3 py-2.5">
                    <p className="text-xs font-semibold text-bon">{s.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink">{s.description}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {resultat.conseilsRace.length > 0 && (
            <Section title="Conseils de race">
              <div className="flex flex-col gap-2">
                {resultat.conseilsRace.map((c, i) => (
                  <div key={i} className="rounded-lg border border-glow/40 bg-glow/10 px-3 py-2.5">
                    <p className="text-xs font-semibold text-glow">{c.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink">{c.description}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <FormulaireCreation
            resultat={resultat}
            campagnes={data.campagnes}
            campagneActiveId={data.campagneActiveId}
          />

          {resultat.avertissements.length > 0 && (
            <Section title="À surveiller">
              <div className="flex flex-col gap-2">
                {resultat.avertissements.map((a, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-essentiel/30 bg-surface px-3 py-2.5 text-xs text-ink"
                  >
                    {a}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}
