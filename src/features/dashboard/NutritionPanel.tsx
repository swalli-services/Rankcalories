import { Apple, Coffee, Moon, Sun, Utensils } from 'lucide-react'
import { Card } from '../../components/ui'
import { dateLabel, dayTotals, formatNumber, macroEnergy } from './model'
import type { DemoDay, MealKind } from './model'

const mealIcons = {
  Desayuno: Coffee,
  Almuerzo: Sun,
  Cena: Moon,
  Colación: Apple,
}
const mealOrder: MealKind[] = ['Desayuno', 'Almuerzo', 'Cena', 'Colación']

export function NutritionPanel({ day }: { day: DemoDay }) {
  const totals = dayTotals(day)
  const entries = [
    {
      label: 'Proteínas',
      grams: totals.protein,
      energy: totals.protein * 4,
      className: 'macro-protein',
    },
    {
      label: 'Carbohidratos',
      grams: totals.carbs,
      energy: totals.carbs * 4,
      className: 'macro-carbs',
    },
    {
      label: 'Grasas',
      grams: totals.fat,
      energy: totals.fat * 9,
      className: 'macro-fat',
    },
  ]
  return (
    <Card className="nutrition-card">
      <div className="card-heading">
        <div>
          <h2>Tu alimentación del día</h2>
          <p className="panel-subtitle">
            {dateLabel(day.date)} ·{' '}
            {day.complete
              ? 'Registro completo'
              : day.meals.length
                ? 'Registro parcial'
                : 'Sin registros'}
          </p>
        </div>
        <Utensils size={19} aria-hidden="true" />
      </div>
      <h3 className="panel-section-title">Macronutrientes</h3>
      <div className="macro-rows">
        {entries.map((entry) => (
          <div className="macro-row" key={entry.label}>
            <span>
              <i className={entry.className} />
              {entry.label}
            </span>
            <strong data-testid={`macro-${entry.className}`}>
              {day.meals.length ? formatNumber(entry.grams) : '—'}{' '}
              <small>g</small>
            </strong>
          </div>
        ))}
      </div>
      {totals.calories > 0 && (
        <>
          <div className="macro-distribution" aria-hidden="true">
            {entries.map((entry) => (
              <span
                className={entry.className}
                key={entry.label}
                style={{ width: `${(entry.energy / totals.calories) * 100}%` }}
              />
            ))}
          </div>
          <p className="panel-footnote macro-energy-label">
            Distribución energética calculada
          </p>
          <ul className="energy-legend">
            {entries.map((entry) => (
              <li key={entry.label}>
                <i className={entry.className} />
                <span>{entry.label}</span>
                <strong>
                  {new Intl.NumberFormat('es-CL', {
                    maximumFractionDigits: 1,
                  }).format((entry.energy / totals.calories) * 100)}{' '}
                  %
                </strong>
              </li>
            ))}
          </ul>
          <p className="panel-footnote">
            Cálculo de la demo: proteínas y carbohidratos × 4; grasas × 9
            kcal/g.
          </p>
        </>
      )}
      <div className="meals-heading">
        <h3 className="panel-section-title">Comidas registradas</h3>
        <span>{day.meals.length} de 4</span>
      </div>
      <ul className="meal-list">
        {mealOrder.map((kind) => {
          const meal = day.meals.find((entry) => entry.kind === kind)
          const Icon = mealIcons[kind]
          return (
            <li key={kind}>
              <span className="meal-icon">
                <Icon size={16} aria-hidden="true" />
              </span>
              <div>
                <strong>{kind}</strong>
                <p>{meal?.description ?? 'Sin registrar'}</p>
              </div>
              <span className="meal-calories" data-testid={`meal-${kind}`}>
                {meal ? (
                  <>
                    {formatNumber(macroEnergy(meal.macros))}
                    <small>kcal</small>
                  </>
                ) : (
                  '—'
                )}
              </span>
            </li>
          )
        })}
      </ul>
      <div className="meal-total">
        <span>
          Total del día
          {day.meals.length > 0 && !day.complete ? ' · Parcial' : ''}
        </span>
        <strong>
          {day.meals.length
            ? `${formatNumber(totals.calories)} kcal`
            : 'Sin registros'}
        </strong>
      </div>
    </Card>
  )
}
