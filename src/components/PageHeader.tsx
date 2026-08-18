import { Link } from 'react-router-dom'
import { ChevronLeft } from './icons'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  back,
  action,
  children,
}: {
  title: string
  subtitle?: string
  back?: string
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/95 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-2">
        {back && (
          <Link
            to={back}
            className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-ink-muted active:bg-surface"
            aria-label="Retour"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-title text-xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="truncate text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </header>
  )
}
