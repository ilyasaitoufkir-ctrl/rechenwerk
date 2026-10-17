import { useId, useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import type { Variable } from '../types/formula'
import { dimensions } from '../units'
import { UnitChip } from './UnitChip'
import { UnitPickerSheet } from './UnitPickerSheet'

interface Props {
  variable: Variable
  wert: string
  einheit: string
  onWertChange: (wert: string) => void
  onEinheitChange: (einheit: string) => void
  deaktiviert?: boolean
  fehler?: string
  einfuegenVorschlag?: { label: string; onClick: () => void }
}

export function FeldEingabe({
  variable,
  wert,
  einheit,
  onWertChange,
  onEinheitChange,
  deaktiviert,
  fehler,
  einfuegenVorschlag,
}: Props) {
  const id = useId()
  const dim = dimensions[variable.dimension]
  const [sheetOffen, setSheetOffen] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-medium text-stone-700">
        {variable.name}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={wert}
          disabled={deaktiviert}
          onChange={(e) => onWertChange(e.target.value)}
          placeholder="0"
          className="min-w-0 flex-1 rounded-xl border border-paper-300 bg-white px-4 py-3 text-[16px] text-stone-900 outline-none transition-colors focus:border-accent-500 disabled:opacity-50"
        />
        {dim.units.length > 1 ? (
          <UnitChip label={dim.units.find((u) => u.id === einheit)?.label ?? einheit} onClick={() => setSheetOffen(true)} />
        ) : (
          <span className="flex items-center px-2 text-[13px] text-stone-500">{dim.units[0]?.label}</span>
        )}
      </div>
      {einfuegenVorschlag && (
        <button
          onClick={einfuegenVorschlag.onClick}
          className="flex items-center gap-1.5 self-start rounded-lg bg-accent-50 px-2.5 py-1 text-[12px] font-medium text-accent-700"
        >
          <ArrowRightLeft size={13} />
          {einfuegenVorschlag.label}
        </button>
      )}
      {variable.hinweis && <p className="text-[12px] text-stone-500">{variable.hinweis}</p>}
      {fehler && <p className="text-[12px] text-red-600">{fehler}</p>}

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
