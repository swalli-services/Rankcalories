import { ShieldCheck, UserRound } from 'lucide-react'
import { Card, Field, LinkButton, Message } from '../../components/ui'
import { useAuth } from '../auth/useAuth'

export function SettingsPage() {
  const { user } = useAuth()
  return (
    <div className="space-y-6">
      <Message>
        La edición del perfil, los objetivos y las preferencias están
        pendientes. El correo mostrado corresponde a tu sesión de Supabase Auth.
      </Message>
      <div className="settings-grid">
        <Card>
          <div className="card-heading">
            <h2>Tu perfil</h2>
            <UserRound size={22} aria-hidden="true" />
          </div>
          <div className="space-y-5">
            <Field
              label="Nombre"
              disabled
              value={
                user?.user_metadata?.full_name ??
                user?.user_metadata?.name ??
                ''
              }
              placeholder="Nombre sin configurar"
            />
            <Field
              label="Correo electrónico"
              type="email"
              disabled
              value={user?.email ?? ''}
            />
            <Field
              label="Objetivo diario de calorías"
              type="number"
              disabled
              placeholder="Pendiente de configurar"
              hint="Los objetivos del dashboard son datos ficticios de demostración."
            />
          </div>
        </Card>
        <Card>
          <div className="card-heading">
            <h2>Cuenta y acceso</h2>
            <ShieldCheck size={22} aria-hidden="true" />
          </div>
          <p className="text-muted mb-6">
            Tu sesión está gestionada por Supabase. Puedes actualizar tu
            contraseña aquí o solicitar un enlace de recuperación por correo.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton to="/update-password" variant="secondary">
              Actualizar contraseña
            </LinkButton>
            <LinkButton to="/forgot-password" variant="secondary">
              Recuperar contraseña
            </LinkButton>
          </div>
        </Card>
      </div>
    </div>
  )
}
