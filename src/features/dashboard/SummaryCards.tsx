import { ChartNoAxesCombined, Flame, Target } from 'lucide-react'
import { Card } from '../../components/ui'
import { dayTotals, formatNumber, goalDifference } from './model'
import type { CalorieGoal, DemoDay } from './model'

export function SummaryCards({
  day,
  goal,
  average,
  count,
}: {
  day: DemoDay
  goal: CalorieGoal
  average: number | null
  count: number
}) {
  const totals = dayTotals(day)
  const difference = goalDifference(day, goal)
  const hasMeals = day.meals.length > 0
  return (
    <div className="summary-grid demo-summary">
      <Card>
        <div className="metric-label">
          <h2>Calorías registradas</h2>
          <span className="metric-icon">
            <Flame size={19} aria-hidden="true" />
          </span>
        </div>
        <p className="metric-value" data-testid="daily-calories">
          {hasMeals ? formatNumber(totals.calories) : '—'} <span>kcal</span>
        </p>
        <p className="metric-note">
          Rango configurado: {formatNumber(goal.min)}–{formatNumber(goal.max)}{' '}
          kcal
        </p>
        <div
          className="calorie-progress"
          role="progressbar"
          aria-label="Calorías registradas respecto al límite superior"
          aria-valuemin={0}
          aria-valuemax={goal.max}
          aria-valuenow={Math.min(totals.calories, goal.max)}
          aria-valuetext={
            hasMeals
              ? `${totals.calories} kcal registradas; rango de ${goal.min} a ${goal.max} kcal${day.complete ? '' : ', registro parcial'}`
              : 'Sin registros; no se puede evaluar'
          }
        >
          <span
            style={{
              width: `${Math.min((totals.calories / goal.max) * 100, 100)}%`,
            }}
          />
          <i style={{ left: `${(goal.min / goal.max) * 100}%` }} />
        </div>
        <p className="metric-note progress-caption">
          {hasMeals
            ? day.complete
              ? 'Día completo'
              : 'Registro parcial · En curso'
            : 'Día sin evaluar'}
        </p>
      </Card>
      <Card>
        <div className="metric-label">
          <h2>Diferencia con el objetivo</h2>
          <span className="metric-icon">
            <Target size={19} aria-hidden="true" />
          </span>
        </div>
        <p
          className={`metric-value ${difference.value === 0 ? 'in-range-value' : ''}`}
          data-testid="goal-difference"
        >
          {difference.value === null
            ? '—'
            : difference.value === 0
              ? 'En rango'
              : formatNumber(difference.value)}
          {difference.value !== null && difference.value !== 0 && (
            <span> kcal</span>
          )}
        </p>
        <p className="difference-label">{difference.label}</p>
        <p className="metric-note difference-description">
          {difference.description}
        </p>
      </Card>
      <Card>
        <div className="metric-label">
          <h2>Promedio</h2>
          <span className="metric-icon">
            <ChartNoAxesCombined size={19} aria-hidden="true" />
          </span>
        </div>
        <p className="metric-value" data-testid="period-average">
          {average === null ? '—' : formatNumber(average)}{' '}
          <span>kcal / día</span>
        </p>
        <p className="difference-label">{count} días completos incluidos</p>
        <p className="metric-note difference-description">
          Promedio de esta semana. Excluye días sin registros y días en curso.
        </p>
      </Card>
    </div>
  )
}
