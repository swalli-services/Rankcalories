import { CheckCheck } from 'lucide-react'
import { Card } from '../../components/ui'
import { dateLabel, dayStatus, dayTotals, formatNumber } from './model'
import type { CalorieGoal, DemoDay } from './model'
import { StatusBadge } from './DayStatus'

export function WeekOverview({
  days,
  goal,
  selectedDate,
  onSelect,
  within,
  evaluated,
}: {
  days: DemoDay[]
  goal: CalorieGoal
  selectedDate: string
  onSelect: (date: string) => void
  within: number
  evaluated: number
}) {
  return (
    <Card className="week-card">
      <div className="card-heading">
        <div>
          <h2>Tu semana, día a día</h2>
          <p className="panel-subtitle">
            {dateLabel(days[0].date)} –{' '}
            {dateLabel(days[days.length - 1].date, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <span className="week-score">
          <CheckCheck size={17} aria-hidden="true" />
          <strong>
            {within} de {evaluated}
          </strong>{' '}
          días completos en objetivo
        </span>
      </div>
      <div
        className="week-days"
        role="group"
        aria-label="Seleccionar día de la semana"
      >
        {days.map((day) => {
          const status = dayStatus(day, goal)
          return (
            <button
              type="button"
              className={`week-day day-${status} ${day.date === selectedDate ? 'selected' : ''}`}
              key={day.date}
              aria-pressed={day.date === selectedDate}
              onClick={() => onSelect(day.date)}
              data-date={day.date}
            >
              <span className="week-day-name">
                {dateLabel(day.date, { weekday: 'long' })}
              </span>
              <span className="week-day-date">
                {dateLabel(day.date, { day: 'numeric', month: 'short' })}
              </span>
              <span className="week-day-total">
                {day.meals.length ? formatNumber(dayTotals(day).calories) : '—'}{' '}
                <small>kcal</small>
              </span>
              <StatusBadge status={status} />
            </button>
          )
        })}
      </div>
      <p className="panel-footnote">
        Solo se evalúan días completos con comidas registradas. Selecciona un
        día para ver su detalle.
      </p>
    </Card>
  )
}
