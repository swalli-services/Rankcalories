import { ChartNoAxesCombined } from 'lucide-react'
import { Card, EmptyState, LinkButton, Message } from '../../components/ui'

export function StatisticsPage() {
  return <div className="space-y-6"><Message>Las gráficas, los filtros por período y los resúmenes nutricionales estarán disponibles cuando se integre el registro de comidas.</Message><Card><div className="card-heading"><h2>Una mirada a tus hábitos</h2><span className="small-badge">Sin registros</span></div><EmptyState icon={ChartNoAxesCombined} title="Tu historia aún está por comenzar" description="Aquí verás la evolución de tus calorías y nutrientes a lo largo del tiempo. Necesitamos registros reales para mostrar tu progreso."><LinkButton to="/calories" variant="secondary">Explorar calculadora</LinkButton></EmptyState></Card></div>
}
