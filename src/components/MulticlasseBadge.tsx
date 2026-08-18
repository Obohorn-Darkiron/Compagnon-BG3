export function MulticlasseBadge({ multiclasse }: { multiclasse: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-border px-2.5 py-0.5 text-xs text-ink-muted">
      {multiclasse ? 'Multi-classe' : 'Mono-classe'}
    </span>
  )
}
