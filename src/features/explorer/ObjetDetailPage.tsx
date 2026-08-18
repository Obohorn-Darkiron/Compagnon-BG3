import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { ImportanceBadge } from '../../components/ImportanceBadge'
import { AlignementBadge } from '../../components/AlignementBadge'
import { MapPin, Package } from '../../components/icons'
import { buildsPourObjet, getObjet, nomAffiche } from '../../data'

function Bloc({
  titre,
  icone,
  children,
}: {
  titre: string
  icone?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border px-4 py-4 last:border-b-0">
      <h2 className="mb-1.5 flex items-center gap-1.5 font-title text-sm font-semibold uppercase tracking-wide text-gold">
        {icone}
        {titre}
      </h2>
      {children}
    </div>
  )
}

export function ObjetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const objet = id ? getObjet(id) : undefined

  if (!objet) return <Navigate to="/explorer" replace />

  const depuis = (location.state as { from?: string } | null)?.from ?? '/explorer'
  const recommandations = buildsPourObjet(objet.id)
  const alternative = objet.alternative ? getObjet(objet.alternative) : undefined

  return (
    <div>
      <PageHeader
        title={nomAffiche(objet)}
        subtitle={objet.type}
        back={depuis}
        action={<AlignementBadge alignement={objet.alignement} />}
      />

      {objet.alignement !== 'neutre' && (
        <div className="mx-4 mt-3 rounded-lg border border-essentiel/30 bg-surface px-3 py-2.5">
          <p className="text-xs text-ink">{objet.alignementNote}</p>
          {alternative && (
            <p className="mt-1.5 text-xs text-ink-muted">
              Alternative sans condition :{' '}
              <Link
                to={`/explorer/${alternative.id}`}
                state={{ from: depuis }}
                className="text-gold underline underline-offset-2"
              >
                {nomAffiche(alternative)}
              </Link>
            </p>
          )}
        </div>
      )}

      {!objet.verifie && (
        <p className="mx-4 mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink-muted">
          Certaines informations de cette fiche restent à confirmer ({objet.aConfirmer.join(', ')}).
        </p>
      )}

      <div className="mt-3">
        <Bloc titre="Quoi" icone={<Package className="h-4 w-4" />}>
          <p className="text-sm text-ink-muted">
            {objet.type} · {objet.rarete}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{objet.effet}</p>
        </Bloc>

        <Bloc titre="Où" icone={<MapPin className="h-4 w-4" />}>
          <p className="text-sm text-ink">
            Acte {objet.acte} · {objet.zone}
          </p>
        </Bloc>

        <Bloc titre="Comment">
          <p className="text-sm leading-relaxed text-ink">{objet.obtention}</p>
        </Bloc>

        <Bloc titre="Pour qui">
          {recommandations.length === 0 ? (
            <p className="text-sm text-ink-muted">Aucun build de la bibliothèque ne le recommande.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recommandations.map(({ build, importance }) => (
                <Link
                  key={build.id}
                  to={`/builds/${build.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 active:bg-surface-raised"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-ink">
                    {build.nom}
                  </span>
                  <ImportanceBadge importance={importance} />
                </Link>
              ))}
            </div>
          )}
        </Bloc>
      </div>
    </div>
  )
}
