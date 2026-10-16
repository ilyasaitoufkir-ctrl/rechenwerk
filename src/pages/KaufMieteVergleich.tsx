import { useMemo, useState } from 'react'
import { parseDecimal, formatNumber } from '../lib/format'
import { WarningBanner } from '../components/WarningBanner'
import { LineChart } from '../components/LineChart'

interface Eingaben {
  kaufpreis: string
  wartungProJahr: string
  restwert: string
  mieteProMonat: string
  nutzungsdauer: string
  zinsProzent: string
}

const STANDARD: Eingaben = {
  kaufpreis: '20000',
  wartungProJahr: '500',
  restwert: '2000',
  mieteProMonat: '350',
  nutzungsdauer: '8',
  zinsProzent: '5',
}

function kumulierteKosten(
  startkosten: number,
  jaehrlicheKosten: number,
  endErtrag: number,
  i: number,
  n: number,
): number[] {
  const werte: number[] = [startkosten]
  for (let t = 1; t <= n; t++) {
    const diskontiert = jaehrlicheKosten / (1 + i) ** t
    let wert = werte[t - 1] + diskontiert
    if (t === n) wert -= endErtrag / (1 + i) ** t
    werte.push(wert)
  }
  return werte
}

export function KaufMieteVergleich() {
  const [eingaben, setEingaben] = useState<Eingaben>(STANDARD)

  function feld(key: keyof Eingaben, label: string, einheit: string) {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {label} <span className="text-stone-400">({einheit})</span>
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={eingaben[key]}
          onChange={(e) => setEingaben((s) => ({ ...s, [key]: e.target.value }))}
          className="rounded-xl border border-paper-300 bg-white px-4 py-3 text-base outline-none focus:border-accent-500 dark:border-white/15 dark:bg-white/5"
        />
      </label>
    )
  }

  const werte = useMemo(() => {
    const kaufpreis = parseDecimal(eingaben.kaufpreis)
    const wartung = parseDecimal(eingaben.wartungProJahr)
    const restwert = parseDecimal(eingaben.restwert)
    const mieteMonat = parseDecimal(eingaben.mieteProMonat)
    const nRoh = parseDecimal(eingaben.nutzungsdauer)
    const zinsProzent = parseDecimal(eingaben.zinsProzent)
    if (
      kaufpreis === null ||
      wartung === null ||
      restwert === null ||
      mieteMonat === null ||
      nRoh === null ||
      zinsProzent === null
    ) {
      return null
    }
    const n = Math.max(1, Math.round(nRoh))
    const i = zinsProzent / 100
    if (i <= -1) return null

    const kauf = kumulierteKosten(kaufpreis, wartung, restwert, i, n)
    const miete = kumulierteKosten(0, mieteMonat * 12, 0, i, n)

    let breakEvenJahr: number | null = null
    for (let t = 0; t <= n; t++) {
      if (kauf[t] <= miete[t]) {
        breakEvenJahr = t
        break
      }
    }

    return { kauf, miete, n, breakEvenJahr }
  }, [eingaben])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Kauf-/Miete-Vergleich</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Kumulierter, diskontierter Kostenverlauf über die Nutzungsdauer
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {feld('kaufpreis', 'Kaufpreis', '€')}
        {feld('wartungProJahr', 'Wartung', '€/Jahr')}
        {feld('restwert', 'Restwert am Ende', '€')}
        {feld('mieteProMonat', 'Miete', '€/Monat')}
        {feld('nutzungsdauer', 'Nutzungsdauer', 'Jahre')}
        {feld('zinsProzent', 'Kalkulationszins', '%')}
      </div>

      {!werte && (
        <WarningBanner nachrichten={['Bitte alle Werte als gültige Zahlen eingeben.']} variante="info" />
      )}

      {werte && (
        <LineChart
          ariaLabel="Kumulierter Kostenverlauf Kauf gegen Miete"
          reihen={[
            {
              label: 'Kauf',
              farbe: '#48656c',
              punkte: werte.kauf.map((v, t) => ({ x: t, y: v })),
            },
            {
              label: 'Miete',
              farbe: '#6c8c5c',
              punkte: werte.miete.map((v, t) => ({ x: t, y: v })),
            },
          ]}
        />
      )}

      {werte && (
        <div className="rounded-xl border border-paper-300 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/5">
          {werte.breakEvenJahr === null ? (
            <p className="text-stone-600 dark:text-stone-400">
              Innerhalb der Nutzungsdauer von {werte.n} Jahren amortisiert sich der Kauf gegenüber der Miete
              nicht.
            </p>
          ) : werte.breakEvenJahr === 0 ? (
            <p className="text-stone-600 dark:text-stone-400">Der Kauf ist von Anfang an günstiger als die Miete.</p>
          ) : (
            <p className="text-stone-600 dark:text-stone-400">
              Break-even nach ca.{' '}
              <span className="font-semibold text-stone-900 dark:text-stone-100">{werte.breakEvenJahr} Jahren</span>{' '}
              - ab dann ist der Kauf günstiger als die Miete.
            </p>
          )}
          <p className="mt-2 flex justify-between text-stone-600 dark:text-stone-400">
            <span>Kumulierte Kosten Kauf nach {werte.n} Jahren</span>
            <span className="font-medium tabular-nums text-stone-900 dark:text-stone-100">
              {formatNumber(werte.kauf[werte.n], 5)} €
            </span>
          </p>
          <p className="flex justify-between text-stone-600 dark:text-stone-400">
            <span>Kumulierte Kosten Miete nach {werte.n} Jahren</span>
            <span className="font-medium tabular-nums text-stone-900 dark:text-stone-100">
              {formatNumber(werte.miete[werte.n], 5)} €
            </span>
          </p>
        </div>
      )}

      <div className="rounded-xl border border-paper-300 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="mb-1 font-semibold text-stone-800 dark:text-stone-200">Annahmen</h2>
        <ul className="list-inside list-disc text-stone-600 dark:text-stone-400">
          <li>Wartungs- und Mietkosten jährlich konstant, jeweils am Jahresende fällig (nachschüssig)</li>
          <li>Restwert fließt am Ende der Nutzungsdauer einmalig als Ertrag ein</li>
          <li>Alle künftigen Zahlungen mit dem Kalkulationszins auf heute abgezinst</li>
        </ul>
      </div>
    </div>
  )
}
