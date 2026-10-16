import { useMemo, useState } from 'react'
import { parseDecimal, formatNumber } from '../lib/format'
import { WarningBanner } from '../components/WarningBanner'
import { LineChart, type ChartPunkt } from '../components/LineChart'
import {
  gleichgewichtY,
  fenskeMindeststufenzahl,
  mindestrueckverhaeltnis,
  mcCabeThiele,
  type McCabeThieleErgebnis,
} from '../lib/rektifikation'

interface Loesung {
  konstruktion: McCabeThieleErgebnis
  Nmin: number
  Rmin: number
  alpha: number
  xF: number
  xD: number
  xB: number
  q: number
  R: number
}

interface Eingaben {
  alpha: string
  xF: string
  xD: string
  xB: string
  q: string
  R: string
}

const STANDARD: Eingaben = { alpha: '2.5', xF: '0.5', xD: '0.95', xB: '0.05', q: '1', R: '2' }

export function McCabeThiele() {
  const [eingaben, setEingaben] = useState<Eingaben>(STANDARD)

  function feld(key: keyof Eingaben, label: string) {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
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

  const ergebnis: { fehler: string } | Loesung = useMemo(() => {
    const alpha = parseDecimal(eingaben.alpha)
    const xF = parseDecimal(eingaben.xF)
    const xD = parseDecimal(eingaben.xD)
    const xB = parseDecimal(eingaben.xB)
    const q = parseDecimal(eingaben.q)
    const R = parseDecimal(eingaben.R)
    if (alpha === null || xF === null || xD === null || xB === null || q === null || R === null) {
      return { fehler: 'Bitte alle Werte als gültige Zahlen eingeben.' }
    }
    let Nmin: number
    let Rmin: number
    try {
      Nmin = fenskeMindeststufenzahl(alpha, xD, xB)
      Rmin = mindestrueckverhaeltnis(alpha, xF, xD, q)
    } catch (e) {
      return { fehler: e instanceof Error ? e.message : 'Fehler bei der Berechnung' }
    }
    if (R <= Rmin) {
      return {
        fehler: `Rücklaufverhältnis R (${formatNumber(R, 4)}) ist nicht größer als R_min (${formatNumber(Rmin, 4)}) - die Stufenzahl wäre unendlich (Pinch).`,
      }
    }
    try {
      const konstruktion = mcCabeThiele(alpha, xD, xB, xF, q, R)
      return { konstruktion, Nmin, Rmin, alpha, xF, xD, xB, q, R }
    } catch (e) {
      return { fehler: e instanceof Error ? e.message : 'Fehler bei der Stufenkonstruktion' }
    }
  }, [eingaben])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">McCabe-Thiele-Diagramm</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Grafische Stufenkonstruktion für die binäre Rektifikation
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {feld('alpha', 'Relative Flüchtigkeit α')}
        {feld('xF', 'Zulauf x_F')}
        {feld('xD', 'Destillat x_D')}
        {feld('xB', 'Sumpf x_B')}
        {feld('q', 'Zulaufzustand q')}
        {feld('R', 'Rücklaufverhältnis R')}
      </div>

      {'fehler' in ergebnis && <WarningBanner nachrichten={[ergebnis.fehler]} />}

      {'konstruktion' in ergebnis && (
        <>
          <Diagramm ergebnis={ergebnis} />
          <div className="rounded-xl border border-sage-200 bg-sage-50 p-4 text-sm dark:border-sage-800/60 dark:bg-sage-900/20">
            <p className="text-stone-700 dark:text-stone-300">
              Theoretische Stufenzahl:{' '}
              <span className="font-semibold">{ergebnis.konstruktion.theoretischeStufenzahl}</span>
            </p>
            <p className="text-stone-700 dark:text-stone-300">
              Zulaufstufe: <span className="font-semibold">{ergebnis.konstruktion.zulaufstufe}</span>
            </p>
            <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
              Zum Vergleich: R_min ≈ {formatNumber(ergebnis.Rmin, 4)}, N_min (Fenske, totaler Rücklauf) ≈{' '}
              {formatNumber(ergebnis.Nmin, 4)}
            </p>
          </div>
        </>
      )}

      <div className="rounded-xl border border-paper-300 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="mb-1 font-semibold text-stone-800 dark:text-stone-200">Annahmen</h2>
        <ul className="list-inside list-disc text-stone-600 dark:text-stone-400">
          <li>Binäres Gemisch, konstante relative Flüchtigkeit α</li>
          <li>Konstanter molarer Rücklauf (CMO) in Verstärkungs- und Abtriebsteil</li>
          <li>Reboiler als theoretische Stufe mitgezählt, Totalkondensator (keine eigene Stufe)</li>
        </ul>
      </div>
    </div>
  )
}

function Diagramm({ ergebnis }: { ergebnis: Loesung }) {
  const { konstruktion, alpha, xF, xD, xB } = ergebnis
  const schnitt = konstruktion.schnittpunktQLinie

  const gleichgewicht: ChartPunkt[] = Array.from({ length: 51 }, (_, i) => {
    const x = i / 50
    return { x, y: gleichgewichtY(x, alpha) }
  })

  const treppe: ChartPunkt[] = [{ x: xD, y: xD }]
  for (const s of konstruktion.stufen) {
    treppe.push({ x: s.x, y: s.y })
    treppe.push({ x: s.x, y: s.yNach })
  }

  return (
    <LineChart
      ariaLabel="McCabe-Thiele-Diagramm"
      reihen={[
        { label: 'Gleichgewicht', farbe: '#9f7b3b', punkte: gleichgewicht },
        {
          label: 'Diagonale',
          farbe: '#c7d4d6',
          punkte: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ],
        },
        {
          label: 'Verstärkung',
          farbe: '#48656c',
          punkte: [
            { x: schnitt.x, y: schnitt.y },
            { x: xD, y: xD },
          ],
        },
        {
          label: 'Abtrieb',
          farbe: '#6c8c5c',
          punkte: [
            { x: xB, y: xB },
            { x: schnitt.x, y: schnitt.y },
          ],
        },
        {
          label: 'q-Linie',
          farbe: '#c084fc',
          punkte: [
            { x: xF, y: xF },
            { x: schnitt.x, y: schnitt.y },
          ],
        },
        { label: 'Stufen', farbe: '#b0463b', punkte: treppe },
      ]}
    />
  )
}
