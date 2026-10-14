import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { ArrowUpRight, LogOut, Menu, X } from 'lucide-react'
import { navigation } from '../app/navigation'
import { Logo } from '../components/ui'
import { useAuth } from '../features/auth/useAuth'
import { formatDate } from '../lib/format'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const [today] = useState(() => formatDate(new Date()))
  const menuButton = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const item = navigation.find((entry) => entry.path === location.pathname)

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Logo />
          <button
            ref={menuButton}
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="app-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        <div
          id="app-menu"
          className={`sidebar-content ${menuOpen ? 'is-open' : ''}`}
        >
          <p className="nav-caption">TU ESPACIO</p>
          <nav aria-label="Navegación principal">
            {navigation.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button
              className="logout"
              type="button"
              onClick={() => {
                void signOut()
                setMenuOpen(false)
              }}
            >
              <LogOut size={19} aria-hidden="true" />
              Cerrar sesión
            </button>
            <div className="sidebar-version">
              <span className="status-dot" />
              <span className="account-email" title={user?.email}>
                {user?.email ?? 'Sesión activa'}
              </span>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-header">
          <div className="breadcrumb">
            Mi espacio <span>/</span> <strong>{item?.label}</strong>
          </div>
          <span className="preview-badge">
            {item?.path === '/dashboard'
              ? 'Datos de demostración'
              : 'Vista inicial'}
          </span>
        </header>
        <main id="main-content" tabIndex={-1} className="main-content">
          {item?.path !== '/dashboard' && (
            <div className="page-heading">
              <div>
                <p className="eyebrow">TU BIENESTAR, DÍA A DÍA</p>
                <h1>{item?.title}</h1>
                <p className="page-description">
                  Construye hábitos que se adapten a ti.
                </p>
              </div>
              <p className="date-label">{today}</p>
            </div>
          )}
          <Outlet />
          <footer className="app-footer">
            <span>NutriLog · Cada pequeño paso cuenta.</span>
            <NavLink to="/settings">
              Tu configuración <ArrowUpRight size={14} aria-hidden="true" />
            </NavLink>
          </footer>
        </main>
      </div>
    </div>
  )
}
