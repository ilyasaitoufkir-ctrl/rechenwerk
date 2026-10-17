import { useState } from 'react'
import { ArrowRightLeft, Check, Copy } from 'lucide-react'
import type { Variable } from '../types/formula'
import { dimensions, fromSI } from '../units'
import { formatNumber } from '../lib/format'
import { UnitChip } from './UnitChip'
import { UnitPickerSheet } from './UnitPickerSheet'

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
  const [sheetOffen, setSheetOffen] = useState(false)
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
    <div className="rounded-2xl bg-accent-100 p-4">
      <p className="text-[13px] font-medium text-accent-700">{variable.name}</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-2 overflow-x-auto">
          <span className={`tabular-nums font-semibold text-accent-900 ${gross ? 'text-[36px]' : 'text-[26px]'}`}>
            {formatiert}
          </span>
          {dim.units.length > 1 ? (
            <UnitChip label={dim.units.find((u) => u.id === einheit)?.label ?? einheit} onClick={() => setSheetOffen(true)} />
          ) : (
            <span className="text-[15px] text-accent-700">{dim.units[0]?.label}</span>
          )}
        </div>
        <div className="flex gap-1">
          {onUebernehmen && (
            <button
              onClick={onUebernehmen}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-accent-700 active:bg-accent-200"
            >
              <ArrowRightLeft size={15} />
              Übernehmen
            </button>
          )}
          <button
            onClick={kopieren}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-accent-700 active:bg-accent-200"
          >
            {kopiert ? <Check size={15} /> : <Copy size={15} />}
            {kopiert ? 'Kopiert' : 'Kopieren'}
          </button>
        </div>
      </div>

      <UnitPickerSheet
        offen={sheetOffen}
        onClose={() => setSheetOffen(false)}
        einheiten={dim.units}
        ausgewaehlt={einheit}
        onSelect={onEinheitChange}
        titel={variable.name}
      />
    </div>
  )
}
