import { getFormel } from '../formulas/registry'
import { Calculator } from '../components/Calculator'
import { navigiere } from '../lib/router'

export function CalculatorPage({ id }: { id: string }) {
  const formel = getFormel(id)

  if (!formel) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-stone-600 dark:text-stone-400">Formel „{id}“ wurde nicht gefunden.</p>
        <button
          onClick={() => navigiere({ name: 'bibliothek' })}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
        >
          Zur Formelbibliothek
        </button>
      </div>
    )
  }

  // key erzwingt einen Remount bei Formelwechsel - sonst bliebe bei reiner
  // Hash-Navigation (kein voller Seiten-Reload) der interne State der
  // vorherigen Formel (z. B. die gewählte Zielgröße) fälschlich erhalten.
  return <Calculator key={formel.id} formel={formel} />
}
