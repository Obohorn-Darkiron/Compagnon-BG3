import type { ReactNode } from 'react'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-4 py-3">
      <h2 className="mb-2 font-title text-sm font-semibold uppercase tracking-wide text-gold">
        {title}
      </h2>
      {children}
    </section>
  )
}
