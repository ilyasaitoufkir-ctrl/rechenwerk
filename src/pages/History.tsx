import { Trash2 } from 'lucide-react'
import { useVerlauf } from '../hooks/useVerlauf'
import { getFormel } from '../formulas/registry'
import { formatNumber } from '../lib/format'
import { fromSI } from '../units'
import { navigiere } from '../lib/router'

export function History() {
  const { verlauf, loeschen, leeren } = useVerlauf()

  if (verlauf.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-stone-600 dark:text-stone-400">
          Noch keine Berechnungen im Verlauf. Deine letzten 50 Berechnungen erscheinen hier.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Verlauf</h1>
        <button
          onClick={leeren}
          className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
        >
          Alle löschen
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {verlauf.map((eintrag) => {
          const formel = getFormel(eintrag.formelId)
          const zielVar = formel?.variablen.find((v) => v.id === eintrag.ziel)
          const wert = zielVar ? fromSI(eintrag.ergebnis[eintrag.ziel], zielVar.dimension, zielVar.defaultUnit) : undefined

          return (
            <div
              key={eintrag.id}
              className="flex items-center gap-2 rounded-xl border border-paper-300 bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5"
            >
              <button
                onClick={() => formel && navigiere({ name: 'formel', id: formel.id })}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-medium text-stone-900 dark:text-stone-100">
                  {eintrag.formelName}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {new Date(eintrag.zeitpunkt).toLocaleString('de-DE')}
                  {zielVar && wert !== undefined
                    ? ` · ${zielVar.name} = ${formatNumber(wert, 4)} ${zielVar.defaultUnit}`
                    : ''}
                </p>
              </button>
              <button
                onClick={() => loeschen(eintrag.id)}
                aria-label="Eintrag löschen"
                className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-paper-100 dark:hover:bg-white/10"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
