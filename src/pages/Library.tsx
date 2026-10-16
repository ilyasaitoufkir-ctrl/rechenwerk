import { useMemo, useState } from 'react'
import { alleFormeln, getKategorien, sucheFormeln } from '../formulas/registry'
import { SearchBar } from '../components/SearchBar'
import { FormulaCard } from '../components/FormulaCard'
import { useFavoriten } from '../hooks/useFavoriten'
import { useVerifizierung } from '../hooks/useVerifizierung'

type StatusFilter = 'alle' | 'verifiziert' | 'unverifiziert' | 'richtwert'

export function Library() {
  const [suche, setSuche] = useState('')
  const [kategorie, setKategorie] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusFilter>('alle')
  const { toggeln, istFavorit } = useFavoriten()
  const { verifizierungen } = useVerifizierung()

  const kategorien = getKategorien()

  const gefiltert = useMemo(() => {
    let liste = sucheFormeln(suche)
    if (kategorie) liste = liste.filter((f) => f.kategorie === kategorie)
    if (status === 'verifiziert') liste = liste.filter((f) => verifizierungen[f.id]?.verifiziert)
    if (status === 'unverifiziert') liste = liste.filter((f) => !verifizierungen[f.id]?.verifiziert)
    if (status === 'richtwert') liste = liste.filter((f) => f.richtwert)
    return liste
  }, [suche, kategorie, status, verifizierungen])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Formelbibliothek</h1>
      <SearchBar value={suche} onChange={setSuche} placeholder="Formel durchsuchen…" />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setKategorie(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            kategorie === null
              ? 'bg-accent-600 text-white'
              : 'bg-paper-100 text-stone-600 dark:bg-white/10 dark:text-stone-300'
          }`}
        >
          Alle Kategorien
        </button>
        {kategorien.map((k) => (
          <button
            key={k}
            onClick={() => setKategorie(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              kategorie === k
                ? 'bg-accent-600 text-white'
                : 'bg-paper-100 text-stone-600 dark:bg-white/10 dark:text-stone-300'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['alle', 'Alle'],
            ['verifiziert', 'Verifiziert'],
            ['unverifiziert', 'Unverifiziert'],
            ['richtwert', 'Richtwert'],
          ] as [StatusFilter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatus(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              status === key
                ? 'bg-sage-600 text-white'
                : 'bg-paper-100 text-stone-600 dark:bg-white/10 dark:text-stone-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-stone-500 dark:text-stone-400">
        {gefiltert.length} von {alleFormeln.length} Formeln
      </p>

      <div className="flex flex-col gap-2">
        {gefiltert.length === 0 && (
          <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
            Keine Formel entspricht den Filtern.
          </p>
        )}
        {gefiltert.map((f) => (
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
