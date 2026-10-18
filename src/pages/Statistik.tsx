import { useMemo, useState } from 'react'
import { Download, Trash2, X } from 'lucide-react'
import { formatNumber } from '../lib/format'
import { berechneKennwerte, parseMessreihe, vertrauensbereichMittelwert } from '../lib/statistik'
import { WarningBanner } from '../components/WarningBanner'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { statistikUebernahmeAbholen } from '../lib/storage'

const VERTRAUENSNIVEAUS = [0.9, 0.95, 0.99] as const
const BEISPIELWERTE = [12.1, 12.4, 11.9, 12.3, 12.0, 12.6, 11.8]

export function Statistik() {
  useSetHeaderTitle('Statistik')
  const [werte, setWerte] = useState<number[]>(() => statistikUebernahmeAbholen() ?? BEISPIELWERTE)
  const [eingabe, setEingabe] = useState('')
  const [niveau, setNiveau] = useState<number>(0.95)

  function einfuegen() {
    const neue = parseMessreihe(eingabe)
    if (neue.length > 0) {
      setWerte((w) => [...w, ...neue])
      setEingabe('')
    }
  }

  function wertLoeschen(i: number) {
    setWerte((w) => w.filter((_, idx) => idx !== i))
  }

  function alleLoeschen() {
    setWerte([])
  }

  const kennwerte = useMemo(() => {
    try {
      return berechneKennwerte(werte)
    } catch {
      return null
    }
  }, [werte])

  const vertrauensbereich = useMemo(() => {
    try {
      return vertrauensbereichMittelwert(werte, niveau)
    } catch {
      return null
    }
  }, [werte, niveau])

  function exportCsv() {
    const zeilen = ['Index;Wert']
    werte.forEach((w, i) => zeilen.push(`${i + 1};${w}`))
    if (kennwerte) {
      zeilen.push('')
      zeilen.push('Kennwert;Wert')
      zeilen.push(`n;${kennwerte.n}`)
      zeilen.push(`Mittelwert;${kennwerte.mittelwert}`)
      zeilen.push(`Median;${kennwerte.median}`)
      zeilen.push(`Stichproben-Standardabweichung;${kennwerte.stabw}`)
      zeilen.push(`Variationskoeffizient;${kennwerte.variationskoeffizient}`)
      zeilen.push(`Minimum;${kennwerte.min}`)
      zeilen.push(`Maximum;${kennwerte.max}`)
      zeilen.push(`Spannweite;${kennwerte.spannweite}`)
    }
    const blob = new Blob([zeilen.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `messreihe-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14px] text-stone-500">Kennwerte und Vertrauensbereich einer Messreihe</p>

      <div className="flex flex-col gap-2">
        <textarea
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          placeholder="Werte einfügen (aus Excel: Tab, Semikolon, Komma oder Zeilenumbruch getrennt, deutsches Komma)"
          rows={3}
          className="rounded-xl border border-paper-300 bg-paper-200 px-4 py-3 text-base outline-none focus:border-accent-500"
        />
        <button
          onClick={einfuegen}
          className="self-start rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-ink hover:bg-accent-700"
        >
          Werte hinzufügen
        </button>
      </div>

      {werte.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">
              Messreihe ({werte.length} Werte)
            </span>
            <button
              onClick={alleLoeschen}
              className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
            >
              <Trash2 size={14} />
              Alle löschen
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {werte.map((w, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full bg-paper-100 px-2.5 py-1 text-xs tabular-nums text-stone-700"
              >
                {formatNumber(w, 5)}
                <button onClick={() => wertLoeschen(i)} aria-label="Wert löschen">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {!kennwerte && (
        <WarningBanner nachrichten={['Mindestens einen Wert eingeben, um Kennwerte zu berechnen.']} variante="info" />
      )}

      {kennwerte && (
        <div className="rounded-xl border border-sage-200 bg-sage-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-sage-700">Kennwerte</h2>
          <dl className="flex flex-col gap-1 text-sm">
            {(
              [
                ['n', kennwerte.n],
                ['Mittelwert', kennwerte.mittelwert],
                ['Median', kennwerte.median],
                ['Stichproben-Standardabweichung (n-1)', kennwerte.stabw],
                ['Variationskoeffizient', kennwerte.variationskoeffizient],
                ['Minimum', kennwerte.min],
                ['Maximum', kennwerte.max],
                ['Spannweite', kennwerte.spannweite],
              ] as [string, number][]
            ).map(([label, wert]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-stone-600">{label}</dt>
                <dd className="shrink-0 font-medium tabular-nums text-stone-900">{formatNumber(wert, 5)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {kennwerte && kennwerte.n >= 2 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-paper-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">Vertrauensbereich des Mittelwerts</h2>
            <div className="flex gap-1">
              {VERTRAUENSNIVEAUS.map((n) => (
                <button
                  key={n}
                  onClick={() => setNiveau(n)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    niveau === n ? 'bg-accent-600 text-ink' : 'bg-paper-200 text-stone-600'
                  }`}
                >
                  {n * 100}%
                </button>
              ))}
            </div>
          </div>
          {vertrauensbereich && (
            <p className="text-sm text-stone-700">
              <span className="font-semibold">
                {formatNumber(vertrauensbereich.mittelwert, 5)} ± {formatNumber(vertrauensbereich.halbbreite, 5)}
              </span>{' '}
              ({formatNumber(vertrauensbereich.untergrenze, 5)} bis {formatNumber(vertrauensbereich.obergrenze, 5)})
            </p>
          )}
        </div>
      )}

      {werte.length > 0 && (
        <button
          onClick={exportCsv}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-paper-200 px-4 py-3 text-sm font-medium text-stone-700"
        >
          <Download size={16} />
          Als CSV exportieren
        </button>
      )}

      <div className="rounded-2xl bg-paper-200 p-4 text-sm">
        <h2 className="mb-1 font-semibold text-stone-800">Annahmen</h2>
        <ul className="list-inside list-disc text-stone-600">
          <li>Stichproben-Standardabweichung mit n-1 (Bessel-Korrektur)</li>
          <li>Vertrauensbereich des Mittelwerts über die t-Verteilung (nicht die Normalverteilung) - korrekt auch bei kleinen Stichproben</li>
          <li>Messwerte als unabhängig und annähernd normalverteilt angenommen</li>
        </ul>
      </div>
    </div>
  )
}
