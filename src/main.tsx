import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { BuildsListPage } from './features/builds/BuildsListPage'
import { BuildDetailPage } from './features/builds/BuildDetailPage'
import { ObjetsListPage } from './features/explorer/ObjetsListPage'
import { ObjetDetailPage } from './features/explorer/ObjetDetailPage'
import { EquipePage } from './features/equipe/EquipePage'
import { EquipeBuilderPage } from './features/equipe/EquipeBuilderPage'
import { PersonnageDetailPage } from './features/equipe/PersonnageDetailPage'
import { ParametresPage } from './features/parametres/ParametresPage'
import { demanderStockagePersistant } from './storage/driver'
import { registerSW } from 'virtual:pwa-register'

demanderStockagePersistant()

const VERIFICATION_MAJ_MS = 60 * 1000

registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => {
      registration.update()
    }, VERIFICATION_MAJ_MS)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Navigate to="/builds" replace />} />
          <Route path="builds" element={<BuildsListPage />} />
          <Route path="builds/:id" element={<BuildDetailPage />} />
          <Route path="explorer" element={<ObjetsListPage />} />
          <Route path="explorer/:id" element={<ObjetDetailPage />} />
          <Route path="equipe" element={<EquipePage />} />
          <Route path="equipe/builder" element={<EquipeBuilderPage />} />
          <Route path="equipe/:id" element={<PersonnageDetailPage />} />
          <Route path="parametres" element={<ParametresPage />} />
          <Route path="*" element={<Navigate to="/builds" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
