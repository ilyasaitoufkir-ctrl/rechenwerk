import { useState } from 'react'
import { ArrowRightLeft, Check, Copy } from 'lucide-react'
import type { Variable } from '../types/formula'
import { dimensions, fromSI } from '../units'
import { formatNumber } from '../lib/format'

interface Props {
  variable: Variable
  wertSI: number
  einheit: string
  onEinheitChange: (einheit: string) => void
  signifikanteStellen: number
  gross?: boolean
  onUebernehmen?: () => void
}

export function ResultDisplay({
  variable,
  wertSI,
  einheit,
  onEinheitChange,
  signifikanteStellen,
  gross = false,
  onUebernehmen,
}: Props) {
  const [kopiert, setKopiert] = useState(false)
  const dim = dimensions[variable.dimension]
  const wertAnzeige = fromSI(wertSI, variable.dimension, einheit)
  const formatiert = formatNumber(wertAnzeige, signifikanteStellen)

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(formatiert.replace(',', '.'))
      setKopiert(true)
      setTimeout(() => setKopiert(false), 1500)
    } catch {
      // Clipboard-API nicht verfügbar - stilles Scheitern, keine Kernfunktion
    }
  }

  return (
    <div className="rounded-2xl border border-sage-200 bg-sage-50 p-4 dark:border-sage-800/60 dark:bg-sage-900/20">
      <p className="text-sm font-medium text-sage-700 dark:text-sage-300">{variable.name}</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-2 overflow-x-auto">
          <span className={gross ? 'text-3xl font-semibold tabular-nums' : 'text-2xl font-semibold tabular-nums'}>
            {formatiert}
          </span>
          {dim.units.length > 1 ? (
            <select
              value={einheit}
              onChange={(e) => onEinheitChange(e.target.value)}
              className="rounded-lg border border-sage-300 bg-white px-2 py-1 text-sm dark:border-sage-700 dark:bg-white/5"
            >
              {dim.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-sage-700 dark:text-sage-300">{dim.units[0]?.label}</span>
          )}
        </div>
        <div className="flex gap-1">
          {onUebernehmen && (
            <button
              onClick={onUebernehmen}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-sage-700 transition-colors hover:bg-sage-100 dark:text-sage-300 dark:hover:bg-sage-800/40"
            >
              <ArrowRightLeft size={16} />
              Übernehmen
            </button>
          )}
          <button
            onClick={kopieren}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-sage-700 transition-colors hover:bg-sage-100 dark:text-sage-300 dark:hover:bg-sage-800/40"
          >
            {kopiert ? <Check size={16} /> : <Copy size={16} />}
            {kopiert ? 'Kopiert' : 'Kopieren'}
          </button>
        </div>
      </div>
    </div>
  )
}
