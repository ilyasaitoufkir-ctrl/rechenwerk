import { Trash2, History as HistoryIcon } from 'lucide-react'
import { useVerlauf } from '../hooks/useVerlauf'
import { getFormel } from '../formulas/registry'
import { formatNumber } from '../lib/format'
import { fromSI } from '../units'
import { navigiere } from '../lib/router'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { EmptyState } from '../components/EmptyState'

export function History() {
  useSetHeaderTitle('Verlauf')
  const { verlauf, loeschen, leeren } = useVerlauf()

  if (verlauf.length === 0) {
    return <EmptyState icon={HistoryIcon} text="Noch keine Berechnungen im Verlauf. Deine letzten 50 Berechnungen erscheinen hier." />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <button onClick={leeren} className="text-[14px] font-medium text-red-600">
          Alle löschen
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {verlauf.map((eintrag) => {
          const formel = getFormel(eintrag.formelId)
          const zielVar = formel?.variablen.find((v) => v.id === eintrag.ziel)
          const wert = zielVar ? fromSI(eintrag.ergebnis[eintrag.ziel], zielVar.dimension, zielVar.defaultUnit) : undefined

          return (
            <div key={eintrag.id} className="flex items-center gap-2 rounded-2xl bg-paper-200 px-3 py-3">
              <button
                onClick={() => formel && navigiere({ name: 'formel', id: formel.id })}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-[16px] font-medium text-stone-900">{eintrag.formelName}</p>
                <p className="text-[12px] text-stone-500">
                  {new Date(eintrag.zeitpunkt).toLocaleString('de-DE')}
                  {zielVar && wert !== undefined ? ` · ${zielVar.name} = ${formatNumber(wert, 4)} ${zielVar.defaultUnit}` : ''}
                </p>
              </button>
              <button onClick={() => loeschen(eintrag.id)} aria-label="Eintrag löschen" className="shrink-0 rounded-lg p-2 text-stone-400">
                <Trash2 size={18} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
