import { useState } from 'react'
import type { FormEvent } from 'react'
import { Sparkles } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import { analysisExample } from './fixtures'
import { dateLabel, formatNumber, macroEnergy } from './model'

export function MealAnalysis({ selectedDate }: { selectedDate: string }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<'example' | 'unsupported' | null>(null)
  function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResult(
      text.trim().replace(/[.!]$/, '').toLocaleLowerCase('es') ===
        analysisExample.text.toLocaleLowerCase('es')
        ? 'example'
        : 'unsupported',
    )
  }
  return (
    <Card className="analysis-card">
      <div className="card-heading">
        <div>
          <h2>¿Qué comiste?</h2>
          <p className="panel-subtitle">
            Para el {dateLabel(selectedDate)} · Demostración sin guardado
          </p>
        </div>
        <Sparkles size={19} aria-hidden="true" />
      </div>
      <form onSubmit={analyze}>
        <label htmlFor="meal-description">
          Describe tu comida y sus cantidades
        </label>
        <textarea
          id="meal-description"
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setResult(null)
          }}
          placeholder={analysisExample.text}
          rows={3}
          required
          maxLength={500}
          aria-describedby="analysis-help"
        />
        <p id="analysis-help" className="panel-footnote">
          Esta demo reconoce únicamente el ejemplo. No utiliza IA ni consulta
          alimentos.
        </p>
        <div className="analysis-actions">
          <Button
            variant="secondary"
            onClick={() => {
              setText(analysisExample.text)
              setResult(null)
            }}
          >
            Usar ejemplo
          </Button>
          <Button type="submit">
            <Sparkles size={15} aria-hidden="true" />
            Analizar · Demo
          </Button>
        </div>
      </form>
      {result && (
        <div className="analysis-result" role="status">
          {result === 'example' ? (
            <>
              <strong>
                Resultado ficticio ·{' '}
                {formatNumber(macroEnergy(analysisExample.macros))} kcal
              </strong>
              <p>
                {analysisExample.description}: {analysisExample.macros.protein}{' '}
                g de proteínas, {analysisExample.macros.carbs} g de
                carbohidratos y {analysisExample.macros.fat} g de grasas.
              </p>
              <p>No se guardó ni se añadió esta comida al día seleccionado.</p>
            </>
          ) : (
            <>
              <strong>Este texto aún no se puede analizar</strong>
              <p>
                Prueba “Usar ejemplo” para ver un resultado ficticio. No se
                guardó ninguna comida.
              </p>
            </>
          )}
        </div>
      )}
    </Card>
  )
}
