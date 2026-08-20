import { NavLink, Outlet } from 'react-router-dom'
import { Shield, Compass, Users, Settings } from './components/icons'
import { TentacleDecoration } from './components/TentacleDecoration'

const tabs = [
  { to: '/builds', label: 'Builds', icon: Shield },
  { to: '/explorer', label: 'Explorer', icon: Compass },
  { to: '/equipe', label: 'Mon Groupe', icon: Users },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
]

function App() {
  return (
    <div className="relative mx-auto flex h-svh max-w-md flex-col overflow-hidden">
      <TentacleDecoration />
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md border-t border-border bg-surface/95 backdrop-blur">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                isActive ? 'text-gold' : 'text-ink-muted'
              }`
            }
          >
            <Icon className="h-6 w-6" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default App
