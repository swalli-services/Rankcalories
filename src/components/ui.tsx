import { useId } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { Info, Leaf } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function Button({ className = '', variant = 'primary', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  return <button type={type} className={`button button-${variant} ${className}`} {...props} />
}

export function LinkButton({ to, children, variant = 'primary' }: { to: string; children: ReactNode; variant?: 'primary' | 'secondary' }) {
  return <Link className={`button button-${variant}`} to={to}>{children}</Link>
}

export function Field({ label, hint, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return <div className="field"><label htmlFor={inputId}>{label}</label><input id={inputId} aria-describedby={hint ? `${inputId}-hint` : undefined} {...props} />{hint && <p id={`${inputId}-hint`} className="field-hint">{hint}</p>}</div>
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

export function Message({ children, title = 'En desarrollo' }: { children: ReactNode; title?: string }) {
  return <div className="message" role="status"><Info size={19} aria-hidden="true" /><div><strong>{title}</strong><p>{children}</p></div></div>
}

export function EmptyState({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children?: ReactNode }) {
  return <div className="empty-state"><span className="icon-tile"><Icon size={25} aria-hidden="true" /></span><h2>{title}</h2><p>{description}</p>{children}</div>
}

export function Logo() {
  return <Link to="/dashboard" className="logo" aria-label="NutriLog, ir al dashboard"><span className="logo-icon"><Leaf size={23} aria-hidden="true" /></span>NutriLog<span className="logo-dot">.</span></Link>
}
