import { useMemo, useState } from 'react'
import { getFormel, sucheFormeln } from '../formulas/registry'
import { SearchBar } from '../components/SearchBar'
import { FormulaCard } from '../components/FormulaCard'
import { EmptyState } from '../components/EmptyState'
import { useFavoriten } from '../hooks/useFavoriten'
import { useVerlauf } from '../hooks/useVerlauf'
import { useVerifizierung } from '../hooks/useVerifizierung'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { navigiere } from '../lib/router'
import { Search } from 'lucide-react'

export function Home() {
  useSetHeaderTitle('Start')
  const [suche, setSuche] = useState('')
  const { favoriten, toggeln, istFavorit } = useFavoriten()
  const { verlauf } = useVerlauf()
  const { verifizierungen } = useVerifizierung()

  const ergebnisse = useMemo(() => sucheFormeln(suche), [suche])

  const zuletztBenutzt = useMemo(() => {
    const ids: string[] = []
    for (const e of verlauf) {
      if (!ids.includes(e.formelId)) ids.push(e.formelId)
      if (ids.length >= 8) break
    }
    return ids.map((id) => getFormel(id)).filter((f) => f !== undefined)
  }, [verlauf])

  const favoritenFormeln = favoriten.map((id) => getFormel(id)).filter((f) => f !== undefined)

  if (suche.trim()) {
    return (
      <div className="flex flex-col gap-4">
        <SearchBar value={suche} onChange={setSuche} />
        <div className="flex flex-col gap-2">
          {ergebnisse.length === 0 && <EmptyState icon={Search} text="Keine Formel gefunden." />}
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

      {zuletztBenutzt.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-[13px] font-semibold text-stone-500">Zuletzt verwendet</h2>
          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {zuletztBenutzt.map((f) => (
              <button
                key={f.id}
                onClick={() => navigiere({ name: 'formel', id: f.id })}
                className="flex w-36 shrink-0 flex-col items-start gap-1 rounded-2xl bg-white p-3 text-left"
              >
                <span className="line-clamp-2 text-[14px] font-medium text-stone-900">{f.name}</span>
                <span className="truncate text-[12px] text-stone-500">{f.kategorie}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-[13px] font-semibold text-stone-500">Favoriten</h2>
        {favoritenFormeln.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-6 text-center text-[13px] text-stone-500">
            Noch keine Favoriten. Tippe im Rechner auf den Stern, um ihn hier anzupinnen.
          </p>
        ) : (
          favoritenFormeln.map((f) => (
            <FormulaCard
              key={f.id}
              formel={f}
              istFavorit
              istVerifiziert={verifizierungen[f.id]?.verifiziert}
              onFavoritToggeln={() => toggeln(f.id)}
            />
          ))
        )}
      </section>
    </div>
  )
}
