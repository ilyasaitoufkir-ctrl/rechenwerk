import { useMemo, useState } from 'react'
import { ScanLine, Bot, Calculator, Library, Search, FolderKanban } from 'lucide-react'
import { getFormel, sucheFormeln } from '../formulas/registry'
import { SearchBar } from '../components/SearchBar'
import { FormulaCard } from '../components/FormulaCard'
import { EmptyState } from '../components/EmptyState'
import { useFavoriten } from '../hooks/useFavoriten'
import { useVerlauf } from '../hooks/useVerlauf'
import { useVerifizierung } from '../hooks/useVerifizierung'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { navigiere, type Route } from '../lib/router'
import { getProjekte } from '../lib/storage'

function begruessung(): string {
  const stunde = new Date().getHours()
  if (stunde < 5) return 'Guten Abend'
  if (stunde < 11) return 'Guten Morgen'
  if (stunde < 18) return 'Guten Tag'
  return 'Guten Abend'
}

const AKTIONEN: { route: Route; icon: typeof ScanLine; erster: string; rest: string }[] = [
  { route: { name: 'scan' }, icon: ScanLine, erster: 'AUFGABE', rest: 'SCANNEN' },
  { route: { name: 'assistent' }, icon: Bot, erster: 'ASSISTENT', rest: 'FRAGEN' },
  { route: { name: 'rechner' }, icon: Calculator, erster: 'RECHNER', rest: 'ÖFFNEN' },
  { route: { name: 'bibliothek' }, icon: Library, erster: '', rest: 'BIBLIOTHEK' },
]

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
  const projekte = getProjekte().slice(0, 3)

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
      <div className="flex flex-col gap-0.5 px-1 pb-1">
        <span className="eyebrow">Rechenwerk</span>
        <p className="text-[30px] font-light leading-tight text-stone-900">{begruessung()}.</p>
        <p className="text-[30px] font-light leading-tight text-stone-500">Was rechnen wir heute?</p>
      </div>

      <section className="flex flex-col gap-2">
        <span className="eyebrow px-1">Ich möchte</span>
        <div className="grid grid-cols-2 gap-2.5">
          {AKTIONEN.map(({ route, icon: Icon, erster, rest }) => (
            <button
              key={rest}
              onClick={() => navigiere(route)}
              className="flex flex-col items-start gap-3 rounded-2xl bg-paper-200 p-4 text-left"
            >
              <Icon size={28} strokeWidth={1.25} className="text-accent-600" />
              <span className="text-[14px] font-bold leading-snug tracking-wide text-stone-900">
                {erster && <span className="font-light text-stone-400">{erster} </span>}
                {rest}
              </span>
            </button>
          ))}
        </div>
      </section>

      <SearchBar value={suche} onChange={setSuche} />

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="eyebrow">Projekte</span>
          {projekte.length > 0 && (
            <button onClick={() => navigiere({ name: 'projekte' })} className="text-[12px] font-medium text-accent-600">
              Alle anzeigen
            </button>
          )}
        </div>
        {projekte.length === 0 ? (
          <button
            onClick={() => navigiere({ name: 'projekte' })}
            className="rounded-2xl bg-paper-200 px-4 py-6 text-center text-[13px] text-stone-500"
          >
            Noch keine Projekte. Tippe, um eines anzulegen.
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            {projekte.map((p) => (
              <button
                key={p.id}
                onClick={() => navigiere({ name: 'projekt', id: p.id })}
                className="flex items-center gap-3 rounded-2xl bg-paper-200 px-3.5 py-3 text-left"
              >
                <FolderKanban size={20} className="shrink-0 text-accent-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-stone-900">{p.name}</p>
                  <p className="text-[12px] text-stone-500">{p.berechnungen.length} Berechnungen</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {zuletztBenutzt.length > 0 && (
        <section className="flex flex-col gap-2">
          <span className="eyebrow px-1">Zuletzt verwendet</span>
          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {zuletztBenutzt.map((f) => (
              <button
                key={f.id}
                onClick={() => navigiere({ name: 'formel', id: f.id })}
                className="flex w-36 shrink-0 flex-col items-start gap-1 rounded-2xl bg-paper-200 p-3 text-left"
              >
                <span className="line-clamp-2 text-[14px] font-medium text-stone-900">{f.name}</span>
                <span className="truncate text-[12px] text-stone-500">{f.kategorie}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <span className="eyebrow px-1">Favoriten</span>
        {favoritenFormeln.length === 0 ? (
          <p className="rounded-2xl bg-paper-200 px-4 py-6 text-center text-[13px] text-stone-500">
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
