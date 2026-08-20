type IconProps = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function Shield({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M12 3v18" opacity="0.5" />
    </svg>
  )
}

export function Compass({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.2 13 13l-3.8 1.8L11 11z" />
    </svg>
  )
}

export function Users({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.5 19c.7-3 3-4.75 6.5-4.75S15.3 16 16 19" />
      <path d="M16 8.25a3 3 0 1 1 1.2 5.75" />
      <path d="M17 14.5c2.6.4 4.2 1.9 4.75 4.5" />
    </svg>
  )
}

export function Settings({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2.2" />
      <line x1="18" y1="12" x2="20.7" y2="12" />
      <line x1="16.24" y1="16.24" x2="18.15" y2="18.15" />
      <line x1="12" y1="18" x2="12" y2="20.7" />
      <line x1="7.76" y1="16.24" x2="5.85" y2="18.15" />
      <line x1="6" y1="12" x2="3.3" y2="12" />
      <line x1="7.76" y1="7.76" x2="5.85" y2="5.85" />
      <line x1="12" y1="6" x2="12" y2="3.3" />
      <line x1="16.24" y1="7.76" x2="18.15" y2="5.85" />
    </svg>
  )
}

export function ChevronLeft({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function Search({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export function Check({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function Download({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 19.5h16" />
    </svg>
  )
}

export function Upload({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M4 19.5h16" />
    </svg>
  )
}

export function MapPin({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

export function Package({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="m3.5 7.5 8.5-4 8.5 4-8.5 4-8.5-4z" />
      <path d="M3.5 7.5v9l8.5 4 8.5-4v-9" />
      <path d="M12 11.5v9" />
    </svg>
  )
}

export function Sparkles({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

export function Plus({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

export function IconeGuerrier({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M6 18 18 6" />
      <path d="M13 4l2 2M18 9l2 2" />
      <path d="M4 20l2-2" />
    </svg>
  )
}

export function IconeMagicien({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M4 20 16 8" />
      <path d="M15 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    </svg>
  )
}

export function IconeOccultiste({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

export function IconeEnsorceleur({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 3c1.5 2.5-1 4-1 6.5a2.5 2.5 0 0 0 5 0c0-1-.4-1.6-.8-2.1" />
      <path d="M8 12a6 6 0 1 0 10.5-4" />
    </svg>
  )
}

export function IconeClerc({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.8 5.8l2 2M16.2 16.2l2 2M18.2 5.8l-2 2M7.8 16.2l-2 2" />
    </svg>
  )
}

export function IconePaladin({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M12 8v6M9 11h6" />
    </svg>
  )
}

export function IconeBarbare({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M6 21 17 10" />
      <path d="M13.5 8c.5-3 3-5.5 6-5.5.3 3-1.7 6-4.7 6.5z" />
    </svg>
  )
}

export function IconeRoublard({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 2v9" />
      <path d="M8 6.5h8" />
      <path d="M12 11l4 9-4-2-4 2z" />
    </svg>
  )
}

export function IconeRodeur({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M6 3c6 3 6 15 0 18" />
      <path d="M6 12h14" />
      <path d="M17 9l3 3-3 3" />
    </svg>
  )
}

export function IconeBarde({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="8" cy="17" r="3" />
      <path d="M11 17V5l8-2v12" />
      <circle cx="16" cy="15" r="3" />
    </svg>
  )
}

export function IconeDruide({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M4 20c8 0 16-6 16-16-10 0-16 8-16 16z" />
      <path d="M6 18c4-4 8-8 12-12" />
    </svg>
  )
}

export function IconeMoine({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 1 0 9" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
