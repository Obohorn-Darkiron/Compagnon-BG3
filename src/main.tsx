import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import './components/installPrompt' // enregistre le listener beforeinstallprompt tôt (voir ce fichier)
import App from './App.tsx'
import {
  BuildDetailPage,
  BuildsListPage,
  ComparerBuildsPage,
  EquipeBuilderPage,
  EquipePage,
  ObjetDetailPage,
  ObjetsListPage,
  ParametresPage,
  PersonnageDetailPage,
} from './routes'
import { demanderStockagePersistant } from './storage/driver'
import { reprendreSessionsActives } from './session/sessionSync'
import { initialiserTheme } from './theme/theme'
import { registerSW } from 'virtual:pwa-register'

initialiserTheme()
demanderStockagePersistant()
reprendreSessionsActives()

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
          <Route path="builds/comparer/:idA/:idB" element={<ComparerBuildsPage />} />
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
