export interface Macros {
  protein: number
  carbs: number
  fat: number
}

export type MealKind = 'Desayuno' | 'Almuerzo' | 'Cena' | 'Colación'
export interface DemoMeal {
  kind: MealKind
  description: string
  macros: Macros
}

export interface DemoDay {
  date: string
  complete: boolean
  meals: DemoMeal[]
}

export interface CalorieGoal {
  min: number
  max: number
}
export type DayStatus = 'within' | 'above' | 'below' | 'ongoing' | 'empty'

export const statusLabels: Record<DayStatus, string> = {
  within: 'En objetivo',
  above: 'Por encima',
  below: 'Por debajo',
  ongoing: 'En curso',
  empty: 'Sin registros',
}

export function macroEnergy(macros: Macros) {
  return macros.protein * 4 + macros.carbs * 4 + macros.fat * 9
}

export function dayTotals(day: DemoDay) {
  const macros = day.meals.reduce<Macros>(
    (total, meal) => ({
      protein: total.protein + meal.macros.protein,
      carbs: total.carbs + meal.macros.carbs,
      fat: total.fat + meal.macros.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 },
  )
  return { ...macros, calories: macroEnergy(macros) }
}

export function dayStatus(day: DemoDay, goal: CalorieGoal): DayStatus {
  if (!day.meals.length) return 'empty'
  if (!day.complete) return 'ongoing'
  const { calories } = dayTotals(day)
  if (calories < goal.min) return 'below'
  if (calories > goal.max) return 'above'
  return 'within'
}

export function goalDifference(day: DemoDay, goal: CalorieGoal) {
  if (!day.meals.length)
    return {
      value: null,
      label: 'Sin datos para comparar',
      description: 'Este día no tiene comidas registradas.',
    }
  const { calories } = dayTotals(day)
  const partial = day.complete
    ? ''
    : ' Registro parcial; el día sigue en curso.'
  if (calories < goal.min)
    return {
      value: goal.min - calories,
      label: 'Para entrar al rango',
      description: `Diferencia respecto al mínimo de ${formatNumber(goal.min)} kcal.${partial}`,
    }
  if (calories > goal.max)
    return {
      value: calories - goal.max,
      label: 'Sobre el límite superior',
      description: `Diferencia respecto al máximo de ${formatNumber(goal.max)} kcal.${partial}`,
    }
  return {
    value: 0,
    label: 'Dentro del rango',
    description: `Tu registro está entre ${formatNumber(goal.min)} y ${formatNumber(goal.max)} kcal.${partial}`,
  }
}

export function periodSummary(days: DemoDay[], goal: CalorieGoal) {
  const evaluated = days.filter((day) => day.complete && day.meals.length > 0)
  return {
    count: evaluated.length,
    within: evaluated.filter((day) => dayStatus(day, goal) === 'within').length,
    average: evaluated.length
      ? evaluated.reduce((sum, day) => sum + dayTotals(day).calories, 0) /
        evaluated.length
      : null,
  }
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(
    value,
  )
}

export function dateLabel(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' },
) {
  return new Intl.DateTimeFormat('es-CL', {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}
