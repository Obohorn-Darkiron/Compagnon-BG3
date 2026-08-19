import { Section } from '../../components/Section'
import type { Build } from '../../data'
import { labelsCarac } from '../../data/permanents'
import { bonusParStatObtenus, calculerPlansCarac, type PlanCarac } from './bonusPermanentsUtils'
import type { Personnage } from '../../storage/useSaveData'

function PlanCaracCard({ plan }: { plan: PlanCarac }) {
  const nom = labelsCarac[plan.stat]
  const totalLibere = plan.totalASI - plan.pointsRestants

  return (
    <div className="rounded-lg border border-glow/40 bg-glow/10 px-3 py-3">
      <p className="text-sm font-semibold text-glow">{nom}</p>
      <p className="mt-1 text-xs text-ink">
        Départ {plan.depart} + {plan.bonusPermanent} permanent · les dons ne devaient fournir que{' '}
        {plan.cible - plan.depart} normalement, il t'en reste réellement besoin de{' '}
        <strong>{plan.pointsRestants}</strong> pour atteindre {plan.cible} — {totalLibere} point
        {totalLibere > 1 ? 's' : ''} de don libéré{totalLibere > 1 ? 's' : ''}.
      </p>
      <ul className="mt-2 space-y-1">
        {plan.niveauxLibres
          .slice()
          .sort((a, b) => a - b)
          .map((n) => (
            <li key={n} className="text-xs text-ink">
              <span className="text-gold">Niveau {n} :</span> entièrement libre — un vrai don au
              choix (Guerrier de guerre pour la Concentration, Vigilant pour l'initiative...).
            </li>
          ))}
        {plan.niveauDemiDon !== null && (
          <li className="text-xs text-ink">
            <span className="text-gold">Niveau {plan.niveauDemiDon} :</span> prends Résilient (
            {nom}) — comble le dernier point tout en donnant la maîtrise des jets de sauvegarde de{' '}
            {nom}.
          </li>
        )}
      </ul>
    </div>
  )
}

export function PlanOptimisationSection({
  build,
  personnage,
}: {
  build: Build
  personnage: Personnage
}) {
  const plans = calculerPlansCarac(build, bonusParStatObtenus(personnage))
  if (plans.length === 0) return null

  return (
    <Section title="Plan optimisé avec tes bonus permanents">
      <div className="flex flex-col gap-3">
        {plans.map((p) => (
          <PlanCaracCard key={p.stat} plan={p} />
        ))}
      </div>
    </Section>
  )
}
