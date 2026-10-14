import { Calculator, Search } from 'lucide-react'
import { Card, EmptyState, Field, Message } from '../../components/ui'

export function CaloriesPage() {
  return <div className="space-y-6"><Message>La búsqueda de alimentos, el cálculo nutricional y el registro de comidas están pendientes de integración.</Message><Card><div className="card-heading"><h2>Explora tus alimentos</h2><Calculator size={22} aria-hidden="true" /></div><p className="text-muted mb-6">Aquí podrás consultar el aporte de cada alimento y armar tus comidas.</p><Field label="Buscar un alimento" type="search" placeholder="Por ejemplo: avena, manzana, arroz…" disabled hint="La búsqueda estará disponible al conectar una fuente de datos nutricionales." /><EmptyState icon={Search} title="Tu próxima comida empieza aquí" description="Podrás buscar alimentos, indicar porciones y consultar calorías y macronutrientes. Aún no hay resultados disponibles." /></Card></div>
}
