import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../../components/ui'
import {
  dateLabel,
  dayStatus,
  dayTotals,
  formatNumber,
  statusLabels,
} from './model'
import type { CalorieGoal, DemoDay } from './model'

export function WeeklyChart({
  days,
  goal,
  selectedDate,
}: {
  days: DemoDay[]
  goal: CalorieGoal
  selectedDate: string
}) {
  const data = days.map((day) => ({
    date: day.date,
    label: dateLabel(day.date, { weekday: 'short' }).replace('.', ''),
    calories: day.meals.length ? dayTotals(day).calories : null,
    status: statusLabels[dayStatus(day, goal)],
    complete: day.complete,
  }))
  return (
    <Card className="weekly-chart-card">
      <div className="card-heading">
        <div>
          <h2>Calorías de la semana</h2>
          <p className="panel-subtitle">
            Día seleccionado:{' '}
            {dateLabel(selectedDate, {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          </p>
        </div>
        <span className="small-badge">kcal / día</span>
      </div>
      <div className="chart-legend" aria-label="Leyenda del gráfico">
        <span>
          <i className="legend-complete" />
          Día completo
        </span>
        <span>
          <i className="legend-partial" />
          Registro parcial
        </span>
        <span>
          <i className="legend-range" />
          Objetivo: {formatNumber(goal.min)}–{formatNumber(goal.max)} kcal
        </span>
      </div>
      <div
        className="weekly-chart"
        role="region"
        aria-label="Gráfico de calorías por día en kilocalorías. Usa las flechas izquierda y derecha para consultar los valores."
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={data}
            accessibilityLayer
            margin={{ top: 12, right: 8, left: -12, bottom: 0 }}
          >
            <defs>
              <pattern
                id="partial-calories"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <rect width="6" height="6" fill="#edf0ef" />
                <path
                  d="M-1 1L1 -1M0 6L6 0M5 7L7 5"
                  stroke="#9ba7a0"
                  strokeWidth="2"
                />
              </pattern>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#edf0ee"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#65736c', fontSize: 12 }}
              interval={0}
              tickFormatter={(label, index) =>
                `${label}${data[index]?.date === selectedDate ? ' •' : ''}`
              }
            />
            <YAxis
              domain={[0, 3000]}
              ticks={[0, 1000, 2000, 3000]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#65736c', fontSize: 11 }}
              width={52}
            />
            <ReferenceArea
              y1={goal.min}
              y2={goal.max}
              fill="#e4efe6"
              fillOpacity={0.8}
              strokeOpacity={0}
            />
            <ReferenceLine
              y={goal.min}
              stroke="#9ab69e"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={goal.max}
              stroke="#9ab69e"
              strokeDasharray="4 4"
            />
            <Tooltip
              cursor={{ fill: '#f0f3f1' }}
              filterNull={false}
              content={({ active, payload }) => {
                const day = payload?.[0]?.payload as
                  (typeof data)[number] | undefined
                if (!active || !day) return null
                return (
                  <div className="chart-tooltip">
                    <strong>
                      {dateLabel(day.date, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </strong>
                    <p>
                      {day.calories === null
                        ? 'Sin registros'
                        : `${formatNumber(day.calories)} kcal`}
                    </p>
                    <span>
                      {day.status} ·{' '}
                      {day.calories === null
                        ? 'No evaluado'
                        : day.complete
                          ? 'Día completo'
                          : 'Registro parcial'}
                    </span>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="calories"
              name="Calorías"
              unit=" kcal"
              radius={[5, 5, 0, 0]}
              maxBarSize={38}
              isAnimationActive={false}
            >
              {data.map((day) => (
                <Cell
                  key={day.date}
                  fill={day.complete ? '#537a61' : 'url(#partial-calories)'}
                  stroke={day.date === selectedDate ? '#203e2d' : 'none'}
                  strokeWidth={day.date === selectedDate ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="panel-footnote">
        El punto del eje marca tu selección. Sin registros no significa 0 kcal.
      </p>
      <details className="chart-data">
        <summary>Ver valores del gráfico</summary>
        <ul>
          {data.map((day) => (
            <li key={day.date}>
              <span>
                {dateLabel(day.date, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <strong>
                {day.calories === null
                  ? 'Sin registros'
                  : `${formatNumber(day.calories)} kcal`}
              </strong>
              <span>{day.status}</span>
            </li>
          ))}
        </ul>
      </details>
    </Card>
  )
}
