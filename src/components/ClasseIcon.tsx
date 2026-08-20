import {
  IconeBarbare,
  IconeBarde,
  IconeClerc,
  IconeDruide,
  IconeEnsorceleur,
  IconeGuerrier,
  IconeMagicien,
  IconeMoine,
  IconeOccultiste,
  IconePaladin,
  IconeRodeur,
  IconeRoublard,
} from './icons'

const ICONES_PAR_CLASSE: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  Barbare: IconeBarbare,
  Barde: IconeBarde,
  Clerc: IconeClerc,
  Druide: IconeDruide,
  Ensorceleur: IconeEnsorceleur,
  Guerrier: IconeGuerrier,
  Magicien: IconeMagicien,
  Moine: IconeMoine,
  Occultiste: IconeOccultiste,
  Paladin: IconePaladin,
  Roublard: IconeRoublard,
  Rôdeur: IconeRodeur,
}

export function ClasseIcon({ classe, className }: { classe: string; className?: string }) {
  const Icone = ICONES_PAR_CLASSE[classe]
  if (!Icone) return null
  return <Icone className={className} />
}
