import { useMemo, useState } from 'react'
import { Plus, Trash2, Info } from 'lucide-react'
import { parseDecimal, formatNumber } from '../lib/format'
import { quadratischeRegression } from '../lib/statistik'
import { WarningBanner } from '../components/WarningBanner'
import { LineChart } from '../components/LineChart'

interface PumpenPunkt {
  v: string
  h: string
}

const STANDARD_PUNKTE: PumpenPunkt[] = [
  { v: '0', h: '32' },
  { v: '10', h: '29' },
  { v: '20', h: '21' },
  { v: '28', h: '8' },
]

export function PumpenBetriebspunkt() {
  const [hStat, setHStat] = useState('5')
  const [vRef, setVRef] = useState('20')
  const [hVerlustRef, setHVerlustRef] = useState('3')
  const [punkte, setPunkte] = useState<PumpenPunkt[]>(STANDARD_PUNKTE)

  function punktAendern(i: number, patch: Partial<PumpenPunkt>) {
    setPunkte((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }
  function punktHinzufuegen() {
    setPunkte((ps) => [...ps, { v: '', h: '' }])
  }
  function punktEntfernen(i: number) {
    setPunkte((ps) => (ps.length > 3 ? ps.filter((_, idx) => idx !== i) : ps))
  }

  const ergebnis = useMemo(() => {
    const hStatRoh = parseDecimal(hStat)
    const vRefRoh = parseDecimal(vRef)
    const hVerlustRefRoh = parseDecimal(hVerlustRef)
    if (hStatRoh === null || vRefRoh === null || hVerlustRefRoh === null || vRefRoh <= 0) return null
    const hStatZahl: number = hStatRoh
    const vRefZahl: number = vRefRoh
    const hVerlustRefZahl: number = hVerlustRefRoh

    const vWerte: number[] = []
    const hWerte: number[] = []
    for (const p of punkte) {
      const v = parseDecimal(p.v)
      const h = parseDecimal(p.h)
      if (v === null || h === null) continue
      vWerte.push(v)
      hWerte.push(h)
    }
    if (vWerte.length < 3) return null

    let pumpe
    try {
      pumpe = quadratischeRegression(vWerte, hWerte)
    } catch {
      return null
    }

    // Anlagenkennlinie: H_A(V) = hStat + hVerlustRef*(V/vRef)²
    const kA = hVerlustRefZahl / (vRefZahl * vRefZahl)
    // Schnittpunkt: hStat + kA*V² = a + b*V + c*V²  ->  (c-kA)V² + bV + (a-hStat) = 0
    const A = pumpe.c - kA
    const B = pumpe.b
    const C = pumpe.a - hStatZahl

    let schnittpunkt: { v: number; h: number } | null = null
    const vMin = Math.min(...vWerte, 0)
    const vMax = Math.max(...vWerte, vRefZahl)

    function kandidat(v: number) {
      if (v >= vMin && v <= vMax && v >= 0) {
        const h = hStatZahl + kA * v * v
        if (h >= 0 && (schnittpunkt === null || v < schnittpunkt.v)) schnittpunkt = { v, h }
      }
    }

    if (Math.abs(A) < 1e-9) {
      if (Math.abs(B) > 1e-12) kandidat(-C / B)
    } else {
      const diskriminante = B * B - 4 * A * C
      if (diskriminante >= 0) {
        const wurzel = Math.sqrt(diskriminante)
        kandidat((-B + wurzel) / (2 * A))
        kandidat((-B - wurzel) / (2 * A))
      }
    }

    const hA = (v: number) => hStatZahl + kA * v * v
    const hP = (v: number) => pumpe!.a + pumpe!.b * v + pumpe!.c * v * v

    const vPlot = Array.from({ length: 41 }, (_, i) => (vMax * i) / 40)

    return {
      anlage: vPlot.map((v) => ({ x: v, y: hA(v) })),
      pumpe: vPlot.map((v) => ({ x: v, y: hP(v) })),
      datenpunkte: vWerte.map((v, i) => ({ x: v, y: hWerte[i] })),
      schnittpunkt: schnittpunkt as { v: number; h: number } | null,
    }
  }, [hStat, vRef, hVerlustRef, punkte])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Pumpen-Betriebspunkt</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Schnittpunkt von Anlagen- und Pumpenkennlinie, Volumenstrom in m³/h, Förderhöhe in m
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-paper-300 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Anlagenkennlinie: H_A = H_stat + Δh_V,ref · (V̇/V̇_ref)²
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
            H_stat (m)
            <input
              type="text"
              inputMode="decimal"
              value={hStat}
              onChange={(e) => setHStat(e.target.value)}
              className="rounded-lg border border-paper-300 bg-white px-3 py-2 text-base dark:border-white/15 dark:bg-white/5"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
            V̇_ref (m³/h)
            <input
              type="text"
              inputMode="decimal"
              value={vRef}
              onChange={(e) => setVRef(e.target.value)}
              className="rounded-lg border border-paper-300 bg-white px-3 py-2 text-base dark:border-white/15 dark:bg-white/5"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
            Δh_V,ref (m)
            <input
              type="text"
              inputMode="decimal"
              value={hVerlustRef}
              onChange={(e) => setHVerlustRef(e.target.value)}
              className="rounded-lg border border-paper-300 bg-white px-3 py-2 text-base dark:border-white/15 dark:bg-white/5"
            />
          </label>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Δh_V,ref: Verlusthöhe bei V̇_ref, z. B. aus "Druckverlust nach Darcy-Weisbach" (Druckhöhe h)
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-paper-300 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Pumpenkennlinie (mindestens 3 Datenblattpunkte)
        </h2>
        {punkte.map((p, i) => (
          <div key={i} className="flex items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
              V̇ (m³/h)
              <input
                type="text"
                inputMode="decimal"
                value={p.v}
                onChange={(e) => punktAendern(i, { v: e.target.value })}
                className="min-w-0 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base dark:border-white/15 dark:bg-white/5"
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
              H (m)
              <input
                type="text"
                inputMode="decimal"
                value={p.h}
                onChange={(e) => punktAendern(i, { h: e.target.value })}
                className="min-w-0 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base dark:border-white/15 dark:bg-white/5"
              />
            </label>
            <button
              onClick={() => punktEntfernen(i)}
              disabled={punkte.length <= 3}
              aria-label="Punkt entfernen"
              className="shrink-0 rounded-lg p-2.5 text-stone-400 hover:bg-paper-100 disabled:opacity-30 dark:hover:bg-white/10"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <button
          onClick={punktHinzufuegen}
          className="flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent-700 hover:bg-accent-50 dark:text-accent-300 dark:hover:bg-accent-900/30"
        >
          <Plus size={14} />
          Punkt hinzufügen
        </button>
      </div>

      {!ergebnis && (
        <WarningBanner nachrichten={['Bitte Anlagendaten und mindestens 3 gültige Pumpenkennlinien-Punkte eingeben.']} variante="info" />
      )}

      {ergebnis && (
        <>
          <LineChart
            ariaLabel="Anlagen- und Pumpenkennlinie mit Betriebspunkt"
            reihen={[
              { label: 'Anlagenkennlinie', farbe: '#48656c', punkte: ergebnis.anlage },
              { label: 'Pumpenkennlinie', farbe: '#6c8c5c', punkte: ergebnis.pumpe },
              { label: 'Datenpunkte', farbe: '#9f7b3b', punkte: ergebnis.datenpunkte, typ: 'punkte' },
            ]}
            markierung={
              ergebnis.schnittpunkt
                ? { x: ergebnis.schnittpunkt.v, y: ergebnis.schnittpunkt.h, label: 'Betriebspunkt' }
                : undefined
            }
          />
          <div className="rounded-xl border border-paper-300 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/5">
            {ergebnis.schnittpunkt ? (
              <p className="text-stone-700 dark:text-stone-300">
                Betriebspunkt: <span className="font-semibold">V̇ = {formatNumber(ergebnis.schnittpunkt.v, 4)} m³/h</span>,{' '}
                <span className="font-semibold">H = {formatNumber(ergebnis.schnittpunkt.h, 4)} m</span>
              </p>
            ) : (
              <p className="text-stone-600 dark:text-stone-400">
                Anlagen- und Pumpenkennlinie schneiden sich im eingegebenen Datenbereich nicht.
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>
          Viskositätskorrektur für Kreiselpumpen ist hier bewusst nicht implementiert. Bei zähen Medien
          (deutlich über Wasserviskosität) weichen Förderhöhe, Volumenstrom und Wirkungsgrad vom
          Wasserkennfeld ab - dafür Herstellerangaben oder das Verfahren nach Hydraulic Institute (ANSI/HI
          9.6.7) verwenden.
        </p>
      </div>

      <div className="rounded-xl border border-paper-300 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="mb-1 font-semibold text-stone-800 dark:text-stone-200">Annahmen</h2>
        <ul className="list-inside list-disc text-stone-600 dark:text-stone-400">
          <li>Anlagenverlust steigt quadratisch mit dem Volumenstrom (Darcy-Weisbach-Annahme)</li>
          <li>Pumpenkennlinie als quadratische Ausgleichskurve durch die Datenblattpunkte angenähert</li>
          <li>Kein Viskositätseinfluss (siehe Hinweis oben)</li>
        </ul>
      </div>
    </div>
  )
}
