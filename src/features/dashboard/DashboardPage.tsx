import { useState } from 'react'
import { CalendarDays, CheckCircle2, Info } from 'lucide-react'
import { demoGoal, demoToday, demoWeek, initialSelectedDate } from './fixtures'
import {
  dateLabel,
  dayStatus,
  dayTotals,
  formatNumber,
  periodSummary,
} from './model'
import { SummaryCards } from './SummaryCards'
import { WeekOverview } from './WeekOverview'
import { WeeklyChart } from './WeeklyChart'
import { MealAnalysis } from './MealAnalysis'
import { NutritionPanel } from './NutritionPanel'
import { StatusBadge } from './DayStatus'
import './dashboard.css'

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate)
  const selected =
    demoWeek.find((day) => day.date === selectedDate) ?? demoWeek[0]
  const status = dayStatus(selected, demoGoal)
  const summary = periodSummary(demoWeek, demoGoal)
  const total = dayTotals(selected).calories
  const explanations = {
    within: '¡Bien hecho! Completaste el día dentro de tu rango configurado.',
    above: `Este día completo quedó ${formatNumber(total - demoGoal.max)} kcal por encima del límite superior. Es un dato para conocer tus hábitos.`,
    below: `Este día completo quedó ${formatNumber(demoGoal.min - total)} kcal por debajo del mínimo del rango. Es un dato para conocer tus hábitos.`,
    ongoing:
      'El día sigue en curso. Las métricas muestran solo lo registrado y todavía no se evalúa el cumplimiento.',
    empty:
      'No hay comidas registradas para este día. No se evalúa el objetivo ni se incluye en el promedio.',
  }
  const NoticeIcon = status === 'within' ? CheckCircle2 : Info
  return (
    <div className="demo-dashboard">
      <div className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">UN PASO A LA VEZ</p>
          <h1>Tu objetivo, día a día</h1>
          <p className="page-description">
            Una mirada sencilla a tu alimentación y a tus hábitos.
          </p>
        </div>
        <div className="selected-date">
          <CalendarDays size={19} aria-hidden="true" />
          <div>
            <strong data-testid="selected-date">
              {dateLabel(selected.date, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </strong>
            <span>
              {selected.date === demoToday
                ? 'Hoy en la demo · Día en curso'
                : 'Día anterior al hoy de la demo'}
            </span>
          </div>
        </div>
      </div>
      <div className="demo-notice">
        <Info size={17} aria-hidden="true" />
        <p>
          <strong>Datos ficticios de demostración.</strong> Hoy simulado: 11 de
          octubre de 2026. Las acciones no guardan datos reales.
        </p>
      </div>
      <SummaryCards
        day={selected}
        goal={demoGoal}
        average={summary.average}
        count={summary.count}
      />
      <WeekOverview
        days={demoWeek}
        goal={demoGoal}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        within={summary.within}
        evaluated={summary.count}
      />
      <div
        className={`selected-day-detail detail-${status}`}
        role="status"
        aria-live="polite"
      >
        <NoticeIcon size={22} aria-hidden="true" />
        <div>
          <strong>
            {dateLabel(selected.date, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </strong>
          <p>{explanations[status]}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="dashboard-panels">
        <div className="dashboard-left">
          <WeeklyChart
            days={demoWeek}
            goal={demoGoal}
            selectedDate={selectedDate}
          />
          <MealAnalysis key={selectedDate} selectedDate={selectedDate} />
        </div>
        <NutritionPanel day={selected} />
      </div>
    </div>
  )
}
