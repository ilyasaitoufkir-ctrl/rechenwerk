import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { parseDecimal, formatNumber } from '../lib/format'
import { WarningBanner } from '../components/WarningBanner'

interface Zutat {
  name: string
  anteil: string
}

const STANDARD: Zutat[] = [
  { name: 'Wasser', anteil: '70' },
  { name: 'Wirkstoff A', anteil: '20' },
  { name: 'Konservierungsmittel', anteil: '10' },
]

type Modus = 'prozent' | 'masse'

export function RezepturSkalieren() {
  const [modus, setModus] = useState<Modus>('prozent')
  const [zutaten, setZutaten] = useState<Zutat[]>(STANDARD)
  const [zielmenge, setZielmenge] = useState('1000')

  function zutatAendern(i: number, patch: Partial<Zutat>) {
    setZutaten((zs) => zs.map((z, idx) => (idx === i ? { ...z, ...patch } : z)))
  }
  function zutatHinzufuegen() {
    setZutaten((zs) => [...zs, { name: '', anteil: '' }])
  }
  function zutatEntfernen(i: number) {
    setZutaten((zs) => (zs.length > 1 ? zs.filter((_, idx) => idx !== i) : zs))
  }

  const ergebnis = useMemo(() => {
    const zielmengeZahl = parseDecimal(zielmenge)
    if (zielmengeZahl === null || zielmengeZahl <= 0) return null

    const werte: { name: string; anteil: number }[] = []
    for (const z of zutaten) {
      const a = parseDecimal(z.anteil)
      if (a === null) return null
      werte.push({ name: z.name || '(ohne Namen)', anteil: a })
    }
    if (werte.length === 0) return null

    const summe = werte.reduce((s, w) => s + w.anteil, 0)
    if (summe <= 0) return null

    const skaliert = werte.map((w) => ({
      name: w.name,
      anteil: w.anteil,
      menge: modus === 'prozent' ? (zielmengeZahl * w.anteil) / 100 : (zielmengeZahl * w.anteil) / summe,
    }))

    return { skaliert, summe }
  }, [zutaten, zielmenge, modus])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Rezeptur skalieren</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Anteile auf eine neue Zielmenge umrechnen
        </p>
      </div>

      <div className="flex gap-2">
        {(['prozent', 'masse'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModus(m)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              modus === m ? 'bg-accent-600 text-white' : 'bg-paper-100 text-stone-600 dark:bg-white/10 dark:text-stone-300'
            }`}
          >
            {m === 'prozent' ? 'Anteile in %' : 'Anteile als Masse'}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Zielmenge (kg)</span>
        <input
          type="text"
          inputMode="decimal"
          value={zielmenge}
          onChange={(e) => setZielmenge(e.target.value)}
          className="rounded-xl border border-paper-300 bg-white px-4 py-3 text-base outline-none focus:border-accent-500 dark:border-white/15 dark:bg-white/5"
        />
      </label>

      <div className="flex flex-col gap-3">
        {zutaten.map((z, i) => (
          <div key={i} className="flex items-end gap-2">
            <label className="flex min-w-0 flex-[2] flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
              Zutat
              <input
                type="text"
                value={z.name}
                onChange={(e) => zutatAendern(i, { name: e.target.value })}
                className="min-w-0 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base dark:border-white/15 dark:bg-white/5"
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
              {modus === 'prozent' ? 'Anteil (%)' : 'Menge (kg)'}
              <input
                type="text"
                inputMode="decimal"
                value={z.anteil}
                onChange={(e) => zutatAendern(i, { anteil: e.target.value })}
                className="min-w-0 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base dark:border-white/15 dark:bg-white/5"
              />
            </label>
            <button
              onClick={() => zutatEntfernen(i)}
              disabled={zutaten.length === 1}
              aria-label="Zutat entfernen"
              className="shrink-0 rounded-lg p-2.5 text-stone-400 hover:bg-paper-100 disabled:opacity-30 dark:hover:bg-white/10"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={zutatHinzufuegen}
        className="flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent-700 hover:bg-accent-50 dark:text-accent-300 dark:hover:bg-accent-900/30"
      >
        <Plus size={14} />
        Zutat hinzufügen
      </button>

      {modus === 'prozent' && ergebnis && Math.abs(ergebnis.summe - 100) > 0.01 && (
        <WarningBanner
          nachrichten={[`Die Anteile summieren sich auf ${formatNumber(ergebnis.summe, 5)}%, nicht 100%.`]}
        />
      )}

      {ergebnis && (
        <div className="rounded-xl border border-sage-200 bg-sage-50 p-4 dark:border-sage-800/60 dark:bg-sage-900/20">
          <h2 className="mb-2 text-sm font-semibold text-sage-700 dark:text-sage-300">Skalierte Rezeptur</h2>
          <ul className="flex flex-col gap-1">
            {ergebnis.skaliert.map((s, i) => (
              <li key={i} className="flex justify-between text-sm text-stone-700 dark:text-stone-300">
                <span>{s.name}</span>
                <span className="font-medium tabular-nums">{formatNumber(s.menge, 5)} kg</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-sage-200 pt-1 text-sm font-semibold text-stone-800 dark:border-sage-800/60 dark:text-stone-100">
              <span>Summe</span>
              <span className="tabular-nums">
                {formatNumber(
                  ergebnis.skaliert.reduce((s, z) => s + z.menge, 0),
                  5,
                )}{' '}
                kg
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
