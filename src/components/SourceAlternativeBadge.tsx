/** Distingue visuellement une alternative confirmée par recherche (verte) d'une suggestion
 * calculée automatiquement à partir des autres builds du catalogue (dorée, moins certaine). */
export function SourceAlternativeBadge({ autoTrouvee }: { autoTrouvee: boolean }) {
  if (autoTrouvee) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-gold-soft/50 bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
        Suggestion
      </span>
    )
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-bon/40 bg-bon/15 px-2 py-0.5 text-[10px] font-medium text-bon">
      Vérifiée
    </span>
  )
}
