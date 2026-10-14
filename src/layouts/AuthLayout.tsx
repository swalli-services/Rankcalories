import { Outlet } from 'react-router'
import { Leaf, Sprout } from 'lucide-react'
import { Logo } from '../components/ui'

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <aside className="auth-story">
        <Logo />
        <div>
          <span className="story-icon">
            <Sprout size={68} strokeWidth={1.3} aria-hidden="true" />
          </span>
          <p className="eyebrow">ALIMENTA TU BIENESTAR</p>
          <h1>
            Conoce tus hábitos.
            <br />
            Cuida de ti.
          </h1>
          <p>
            Tu alimentación, tus objetivos y tu progreso. Todo en un mismo
            lugar.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm">
          <Leaf size={17} aria-hidden="true" />
          Pequeños pasos. Hábitos duraderos.
        </p>
      </aside>
      <main id="main-content" tabIndex={-1} className="auth-main">
        <div className="auth-mobile-logo">
          <Logo />
        </div>
        <div className="auth-panel">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
