import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Section } from '../../components/Section'
import { Download, Upload } from '../../components/icons'
import { builds, objets } from '../../data'
import { saveStore } from '../../storage/useSaveData'
import { forcerMiseAJour, stockageEstPersistant } from '../../storage/driver'
import { THEMES, definirTheme, useTheme } from '../../theme/theme'

const estInstallee =
  typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches

function telechargerFichier(contenu: string, nomFichier: string) {
  const blob = new Blob([contenu], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nomFichier
  lien.click()
  URL.revokeObjectURL(url)
}

export function ParametresPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [persistant, setPersistant] = useState<boolean | null>(null)
  const [recherche, setRecherche] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    stockageEstPersistant().then(setPersistant)
  }, [])

  function verifierMaj() {
    setRecherche(true)
    forcerMiseAJour()
  }

  function exporter() {
    const date = new Date().toISOString().slice(0, 10)
    telechargerFichier(saveStore.exporterJson(), `bg3-compagnon-sauvegarde-${date}.json`)
  }

  function importer(fichier: File) {
    const lecteur = new FileReader()
    lecteur.onload = () => {
      const resultat = saveStore.importerJson(String(lecteur.result))
      setMessage(resultat.ok ? 'Sauvegarde importée avec succès.' : resultat.erreur)
    }
    lecteur.readAsText(fichier)
  }

  return (
    <div>
      <PageHeader title="Paramètres" />

      <Section title="Thème">
        <p className="mb-3 text-sm text-ink-muted">
          Change juste l'apparence — rien d'autre ne bouge, tes campagnes restent intactes.
        </p>
        <div className="flex gap-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => definirTheme(t.id)}
              aria-label={`Thème ${t.label}`}
              aria-pressed={theme === t.id}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={`h-11 w-11 rounded-xl transition-shadow ${
                  theme === t.id ? 'ring-2 ring-ink ring-offset-2 ring-offset-bg' : ''
                }`}
                style={{
                  background: `linear-gradient(135deg, ${t.couleurFond} 50%, ${t.couleurAccent} 50%)`,
                }}
              />
              <span className={`text-xs ${theme === t.id ? 'font-semibold text-ink' : 'text-ink-muted'}`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Sauvegarde">
        <p className="mb-3 text-sm text-ink-muted">
          Tes campagnes et personnages sont stockés uniquement sur cet appareil, dans la mémoire
          du navigateur. Fermer l'appli ou éteindre le téléphone n'efface rien.
        </p>
        {!estInstallee && (
          <p className="mb-3 rounded-lg border border-glow/40 bg-glow/10 px-3 py-2.5 text-xs text-ink">
            Pour une sauvegarde plus solide dans la durée, ajoute l'appli à l'écran d'accueil de
            ton téléphone (menu du navigateur → « Ajouter à l'écran d'accueil »). Elle se
            comportera comme une vraie appli et le téléphone la traitera comme telle.
          </p>
        )}
        {persistant === false && (
          <p className="mb-3 rounded-lg border border-essentiel/40 bg-essentiel/10 px-3 py-2.5 text-xs text-essentiel">
            Ton navigateur pourrait effacer ces données si le téléphone manque de place de
            stockage. Exporte une sauvegarde de temps en temps par sécurité.
          </p>
        )}
        {persistant === true && (
          <p className="mb-3 rounded-lg border border-bon/40 bg-bon/10 px-3 py-2.5 text-xs text-bon">
            Ton navigateur protège ces données contre un nettoyage automatique de stockage.
          </p>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={exporter}
            className="flex items-center justify-center gap-2 rounded-lg bg-gold px-3 py-2.5 text-sm font-medium text-bg"
          >
            <Download className="h-4 w-4" />
            Exporter ma sauvegarde
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm text-ink"
          >
            <Upload className="h-4 w-4" />
            Importer une sauvegarde
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const fichier = e.target.files?.[0]
              if (fichier) importer(fichier)
              e.target.value = ''
            }}
          />
        </div>
        {message && <p className="mt-2 text-sm text-ink-muted">{message}</p>}
      </Section>

      <Section title="Mise à jour">
        <p className="mb-3 text-sm text-ink-muted">
          L'appli se met normalement à jour toute seule en arrière-plan. Si tu sais qu'une
          nouveauté est sortie et que tu ne la vois pas, force la vérification ici.
        </p>
        <button
          type="button"
          onClick={verifierMaj}
          disabled={recherche}
          className="w-full rounded-lg border border-glow/60 bg-glow/10 py-2.5 text-sm font-medium text-glow disabled:opacity-60"
        >
          {recherche ? 'Recherche de la dernière version…' : 'Forcer la mise à jour'}
        </button>
      </Section>

      <Section title="Réinitialiser">
        <button
          type="button"
          onClick={() => {
            if (confirm('Supprimer toutes les campagnes et tous les personnages ?')) {
              saveStore.reinitialiser()
              setMessage('Sauvegarde réinitialisée.')
            }
          }}
          className="w-full rounded-lg border border-essentiel/40 py-2.5 text-sm text-essentiel"
        >
          Réinitialiser toutes mes données
        </button>
      </Section>

      <Section title="À propos">
        <p className="text-sm text-ink-muted">
          Compagnon non-officiel pour Baldur's Gate 3. {builds.length} builds et {objets.length}{' '}
          objets référencés. Aucune donnée n'est envoyée sur internet — tout reste sur cet
          appareil.
        </p>
        <p className="mt-3 text-xs text-ink-muted">
          Icône tentacule décorative : « Curled Tentacle » par Lorc (
          <a
            href="https://game-icons.net"
            className="underline underline-offset-2"
          >
            game-icons.net
          </a>
          ), sous licence{' '}
          <a
            href="https://creativecommons.org/licenses/by/3.0/"
            className="underline underline-offset-2"
          >
            CC BY 3.0
          </a>
          .
        </p>
      </Section>
    </div>
  )
}
