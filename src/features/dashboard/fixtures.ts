import type { CalorieGoal, DemoDay, DemoMeal, MealKind } from './model'

// Una semana fija facilita revisar todos los estados, independientemente de la fecha real.
export const demoToday = '2026-10-11'
export const initialSelectedDate = '2026-10-08'
export const demoGoal: CalorieGoal = { min: 2000, max: 2300 }

function meal(
  kind: MealKind,
  description: string,
  protein: number,
  carbs: number,
  fat: number,
): DemoMeal {
  return { kind, description, macros: { protein, carbs, fat } }
}

// Las kcal se derivan de los macros (4/4/9), nunca se mantienen totales duplicados.
// Son ejemplos de interfaz, no valores de una base de alimentos ni recomendaciones.
export const demoWeek: DemoDay[] = [
  {
    date: '2026-10-05',
    complete: true,
    meals: [
      meal('Desayuno', 'Avena con leche, plátano y semillas', 20, 60, 12),
      meal('Almuerzo', 'Pollo a la plancha con arroz y verduras', 40, 80, 18),
      meal('Cena', 'Tostadas integrales con atún y palta', 30, 70, 14),
      meal('Colación', 'Yogur natural con fruta y nueces', 15, 35, 10),
    ],
  },
  {
    date: '2026-10-06',
    complete: true,
    meals: [
      meal('Desayuno', 'Pan integral con huevos y una naranja', 25, 65, 12),
      meal('Almuerzo', 'Lentejas con arroz y ensalada fresca', 45, 90, 20),
      meal('Cena', 'Pescado al horno con papas y verduras', 35, 65, 16),
      meal('Colación', 'Yogur, granola y almendras', 20, 35, 12),
    ],
  },
  {
    date: '2026-10-07',
    complete: true,
    meals: [
      meal('Desayuno', 'Tostadas con palta, huevos y fruta', 30, 75, 18),
      meal('Almuerzo', 'Pasta con pollo y salsa de tomate', 50, 100, 25),
      meal('Cena', 'Hamburguesa casera con papas al horno', 40, 85, 22),
      meal('Colación', 'Yogur con granola y mantequilla de maní', 20, 35, 14),
    ],
  },
  {
    date: '2026-10-08',
    complete: true,
    meals: [
      meal('Desayuno', 'Avena con yogur, frutos rojos y nueces', 25, 60, 14),
      meal('Almuerzo', 'Bowl de arroz, pollo y verduras', 45, 85, 20),
      meal('Cena', 'Salmón con quinoa y ensalada', 35, 70, 18),
      meal('Colación', 'Pan integral con queso y una manzana', 15, 35, 12),
    ],
  },
  { date: '2026-10-09', complete: false, meals: [] },
  {
    date: '2026-10-10',
    complete: true,
    meals: [
      meal('Desayuno', 'Pan integral, huevos revueltos y fruta', 30, 70, 14),
      meal('Almuerzo', 'Arroz con carne magra y verduras', 45, 90, 20),
      meal('Cena', 'Ensalada tibia de garbanzos y pollo', 35, 65, 18),
      meal('Colación', 'Yogur natural con avena y nueces', 20, 30, 10),
    ],
  },
  {
    date: demoToday,
    complete: false,
    meals: [
      meal('Desayuno', 'Avena con leche, plátano y almendras', 25, 60, 12),
      meal('Almuerzo', 'Pollo con arroz integral y ensalada', 45, 85, 20),
    ],
  },
]

export const analysisExample = {
  text: 'Comí 150 g de arroz cocido y dos huevos',
  description: '150 g de arroz cocido y 2 huevos',
  macros: { protein: 17, carbs: 43, fat: 11 },
}
