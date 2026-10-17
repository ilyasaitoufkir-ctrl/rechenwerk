import { getFormel } from '../formulas/registry'
import { Calculator } from '../components/Calculator'
import { navigiere } from '../lib/router'
import { useSetHeaderTitle } from '../lib/headerTitleContext'

export function CalculatorPage({ id }: { id: string }) {
  const formel = getFormel(id)
  useSetHeaderTitle(formel ? formel.name : 'Nicht gefunden')

  if (!formel) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-[15px] text-stone-600">Formel „{id}“ wurde nicht gefunden.</p>
        <button
          onClick={() => navigiere({ name: 'rechner' })}
          className="rounded-xl bg-accent-600 px-4 py-2 text-[14px] font-medium text-white"
        >
          Zu den Rechnern
        </button>
      </div>
    )
  }

  // key erzwingt einen Remount bei Formelwechsel - sonst bliebe bei reiner
  // Hash-Navigation (kein voller Seiten-Reload) der interne State der
  // vorherigen Formel (z. B. die gewählte Zielgröße) fälschlich erhalten.
  return <Calculator key={formel.id} formel={formel} />
}
