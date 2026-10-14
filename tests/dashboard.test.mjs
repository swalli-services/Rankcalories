import assert from 'node:assert/strict'
import test from 'node:test'
import {
  demoGoal,
  demoToday,
  demoWeek,
  analysisExample,
} from '../src/features/dashboard/fixtures.ts'
import {
  dayStatus,
  dayTotals,
  goalDifference,
  macroEnergy,
  periodSummary,
} from '../src/features/dashboard/model.ts'

test('los totales de los siete días coinciden con las comidas y los macros', () => {
  const expected = [1886, 2060, 2451, 2056, 0, 2098, 1148]
  for (const [index, day] of demoWeek.entries()) {
    const totals = dayTotals(day)
    assert.equal(totals.calories, expected[index])
    assert.equal(
      totals.calories,
      day.meals.reduce((sum, meal) => sum + macroEnergy(meal.macros), 0),
    )
    for (const key of ['protein', 'carbs', 'fat']) {
      assert.equal(
        totals[key],
        day.meals.reduce((sum, meal) => sum + meal.macros[key], 0),
      )
    }
  }
  assert.equal(macroEnergy(analysisExample.macros), 339)
})

test('la semana cubre los cinco estados; el hoy simulado queda en curso', () => {
  assert.deepEqual(
    demoWeek.map((day) => dayStatus(day, demoGoal)),
    ['below', 'within', 'above', 'within', 'empty', 'within', 'ongoing'],
  )
  assert.equal(demoWeek.at(-1).date, demoToday)
  assert.ok(demoWeek.slice(0, -1).every((day) => day.date < demoToday))
})

test('el promedio y el cumplimiento excluyen días sin registros y parciales', () => {
  assert.deepEqual(periodSummary(demoWeek, demoGoal), {
    count: 5,
    within: 3,
    average: 2110.2,
  })
  assert.deepEqual(periodSummary([], demoGoal), {
    count: 0,
    within: 0,
    average: null,
  })
  assert.deepEqual(
    periodSummary([{ date: demoToday, complete: true, meals: [] }], demoGoal),
    { count: 0, within: 0, average: null },
  )
})

test('la diferencia usa el mínimo para déficit y el máximo para exceso', () => {
  assert.equal(goalDifference(demoWeek[0], demoGoal).value, 114)
  assert.equal(goalDifference(demoWeek[2], demoGoal).value, 151)
  assert.equal(goalDifference(demoWeek[3], demoGoal).value, 0)
  assert.equal(goalDifference(demoWeek[4], demoGoal).value, null)
  assert.equal(goalDifference(demoWeek[6], demoGoal).value, 852)
  assert.match(
    goalDifference(demoWeek[6], demoGoal).description,
    /Registro parcial/,
  )
})

test('los límites son inclusivos y un registro parcial no se evalúa como completo', () => {
  const makeDay = (calories, complete = true) => ({
    date: demoToday,
    complete,
    meals: [
      {
        kind: 'Almuerzo',
        description: 'Caso de prueba',
        macros: { protein: 0, carbs: calories / 4, fat: 0 },
      },
    ],
  })
  for (const calories of [2000, 2300]) {
    assert.equal(dayStatus(makeDay(calories), demoGoal), 'within')
    assert.equal(goalDifference(makeDay(calories), demoGoal).value, 0)
  }
  assert.equal(dayStatus(makeDay(1999), demoGoal), 'below')
  assert.equal(dayStatus(makeDay(2301), demoGoal), 'above')
  assert.equal(dayStatus(makeDay(2100, false), demoGoal), 'ongoing')
  assert.equal(dayStatus(makeDay(2400, false), demoGoal), 'ongoing')
  assert.equal(goalDifference(makeDay(2400, false), demoGoal).value, 100)
})
