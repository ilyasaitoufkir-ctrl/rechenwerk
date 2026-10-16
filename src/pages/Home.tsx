import { useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { alleFormeln, getFormel, getKategorien, sucheFormeln } from '../formulas/registry'
import { SearchBar } from '../components/SearchBar'
import { FormulaCard } from '../components/FormulaCard'
import { useFavoriten } from '../hooks/useFavoriten'
import { useVerlauf } from '../hooks/useVerlauf'
import { useVerifizierung } from '../hooks/useVerifizierung'
import { navigiere } from '../lib/router'

export function Home() {
  const [suche, setSuche] = useState('')
  const { favoriten, toggeln, istFavorit } = useFavoriten()
  const { verlauf } = useVerlauf()
  const { verifizierungen } = useVerifizierung()

  const ergebnisse = useMemo(() => sucheFormeln(suche), [suche])

  const zuletztBenutzt = useMemo(() => {
    const ids: string[] = []
    for (const e of verlauf) {
      if (!ids.includes(e.formelId)) ids.push(e.formelId)
      if (ids.length >= 5) break
    }
    return ids.map((id) => getFormel(id)).filter((f) => f !== undefined)
  }, [verlauf])

  const favoritenFormeln = favoriten.map((id) => getFormel(id)).filter((f) => f !== undefined)
  const kategorien = getKategorien()

  if (suche.trim()) {
    return (
      <div className="flex flex-col gap-4">
        <SearchBar value={suche} onChange={setSuche} />
        <div className="flex flex-col gap-2">
          {ergebnisse.length === 0 && (
            <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
              Keine Formel gefunden.
            </p>
          )}
          {ergebnisse.map((f) => (
            <FormulaCard
              key={f.id}
              formel={f}
              istFavorit={istFavorit(f.id)}
              istVerifiziert={verifizierungen[f.id]?.verifiziert}
              onFavoritToggeln={() => toggeln(f.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <SearchBar value={suche} onChange={setSuche} />

      {favoritenFormeln.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Favoriten</h2>
          {favoritenFormeln.map((f) => (
            <FormulaCard
              key={f.id}
              formel={f}
              istFavorit
              istVerifiziert={verifizierungen[f.id]?.verifiziert}
              onFavoritToggeln={() => toggeln(f.id)}
            />
          ))}
        </section>
      )}

      {favoritenFormeln.length === 0 && (
        <p className="rounded-xl border border-dashed border-paper-300 p-4 text-center text-sm text-stone-500 dark:border-white/15 dark:text-stone-400">
          Noch keine Favoriten. Tippe auf den Stern bei einer Formel, um sie hier anzupinnen.
        </p>
      )}

      {zuletztBenutzt.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Zuletzt benutzt</h2>
          {zuletztBenutzt.map((f) => (
            <FormulaCard
              key={f.id}
              formel={f}
              istFavorit={istFavorit(f.id)}
              istVerifiziert={verifizierungen[f.id]?.verifiziert}
              onFavoritToggeln={() => toggeln(f.id)}
            />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Kategorien</h2>
        <div className="grid grid-cols-2 gap-3">
          {kategorien.map((k) => {
            const anzahl = alleFormeln.filter((f) => f.kategorie === k).length
            return (
              <button
                key={k}
                onClick={() => navigiere({ name: 'bibliothek' })}
                className="flex flex-col items-start gap-2 rounded-xl border border-paper-300 bg-white p-4 text-left transition-colors hover:border-accent-300 dark:border-white/10 dark:bg-white/5"
              >
                <Layers size={20} className="text-accent-600 dark:text-accent-300" />
                <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{k}</span>
                <span className="text-xs text-stone-500 dark:text-stone-400">{anzahl} Formeln</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
