import { lazy } from 'react'

export const BuildsListPage = lazy(() =>
  import('./features/builds/BuildsListPage').then((m) => ({ default: m.BuildsListPage })),
)
export const BuildDetailPage = lazy(() =>
  import('./features/builds/BuildDetailPage').then((m) => ({ default: m.BuildDetailPage })),
)
export const ComparerBuildsPage = lazy(() =>
  import('./features/builds/ComparerBuildsPage').then((m) => ({ default: m.ComparerBuildsPage })),
)
export const ObjetsListPage = lazy(() =>
  import('./features/explorer/ObjetsListPage').then((m) => ({ default: m.ObjetsListPage })),
)
export const ObjetDetailPage = lazy(() =>
  import('./features/explorer/ObjetDetailPage').then((m) => ({ default: m.ObjetDetailPage })),
)
export const EquipePage = lazy(() =>
  import('./features/equipe/EquipePage').then((m) => ({ default: m.EquipePage })),
)
export const EquipeBuilderPage = lazy(() =>
  import('./features/equipe/EquipeBuilderPage').then((m) => ({ default: m.EquipeBuilderPage })),
)
export const PersonnageDetailPage = lazy(() =>
  import('./features/equipe/PersonnageDetailPage').then((m) => ({ default: m.PersonnageDetailPage })),
)
export const ParametresPage = lazy(() =>
  import('./features/parametres/ParametresPage').then((m) => ({ default: m.ParametresPage })),
)
