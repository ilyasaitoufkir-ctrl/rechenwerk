import { useId } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import type { Variable } from '../types/formula'
import { dimensions } from '../units'

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

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-stone-700 dark:text-stone-300">
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
          className="min-w-0 flex-1 rounded-xl border border-paper-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-200 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-stone-100 dark:focus:border-accent-400 dark:focus:ring-accent-800"
        />
        {dim.units.length > 1 ? (
          <select
            value={einheit}
            onChange={(e) => onEinheitChange(e.target.value)}
            className="rounded-xl border border-paper-300 bg-white px-3 py-3 text-base text-stone-900 outline-none focus:border-accent-500 dark:border-white/15 dark:bg-white/5 dark:text-stone-100"
          >
            {dim.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="flex items-center px-2 text-sm text-stone-500 dark:text-stone-400">
            {dim.units[0]?.label}
          </span>
        )}
      </div>
      {einfuegenVorschlag && (
        <button
          onClick={einfuegenVorschlag.onClick}
          className="flex items-center gap-1.5 self-start rounded-lg bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700 hover:bg-accent-100 dark:bg-accent-900/30 dark:text-accent-300 dark:hover:bg-accent-900/50"
        >
          <ArrowRightLeft size={13} />
          {einfuegenVorschlag.label}
        </button>
      )}
      {variable.hinweis && (
        <p className="text-xs text-stone-500 dark:text-stone-400">{variable.hinweis}</p>
      )}
      {fehler && <p className="text-xs text-red-600 dark:text-red-400">{fehler}</p>}
    </div>
  )
}
