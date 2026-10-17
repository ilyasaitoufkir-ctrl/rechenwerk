import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { parseDecimal, formatNumber } from '../lib/format'
import { lineareRegression } from '../lib/statistik'
import { WarningBanner } from '../components/WarningBanner'
import { LineChart } from '../components/LineChart'
import { useSetHeaderTitle } from '../lib/headerTitleContext'

interface Punkt {
  x: string
  y: string
}

const STANDARD: Punkt[] = [
  { x: '1', y: '2,1' },
  { x: '2', y: '3,9' },
  { x: '3', y: '6,2' },
  { x: '4', y: '7,8' },
  { x: '5', y: '10,1' },
]

function parsePaare(text: string): { x: number; y: number }[] {
  const zeilen = text
    .split('\n')
    .map((z) => z.trim())
    .filter((z) => z !== '')
  const paare: { x: number; y: number }[] = []
  for (const zeile of zeilen) {
    const teile = zeile
      .split(/[\t;]+/)
      .map((t) => t.trim())
      .filter((t) => t !== '')
    if (teile.length < 2) continue
    const x = parseDecimal(teile[0])
    const y = parseDecimal(teile[1])
    if (x !== null && y !== null) paare.push({ x, y })
  }
  return paare
}

export function Regression() {
  useSetHeaderTitle('Lineare Regression')
  const [punkte, setPunkte] = useState<Punkt[]>(STANDARD)
  const [paste, setPaste] = useState('')
  const [yMesswert, setYMesswert] = useState('')

  function punktAendern(i: number, patch: Partial<Punkt>) {
    setPunkte((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }
  function punktHinzufuegen() {
    setPunkte((ps) => [...ps, { x: '', y: '' }])
  }
  function punktEntfernen(i: number) {
    setPunkte((ps) => (ps.length > 1 ? ps.filter((_, idx) => idx !== i) : ps))
  }
  function einfuegen() {
    const neue = parsePaare(paste)
    if (neue.length > 0) {
      setPunkte((ps) => [...ps, ...neue.map((p) => ({ x: String(p.x), y: String(p.y) }))])
      setPaste('')
    }
  }

  const regression = useMemo(() => {
    const gueltig: { x: number; y: number }[] = []
    for (const p of punkte) {
      const x = parseDecimal(p.x)
      const y = parseDecimal(p.y)
      if (x !== null && y !== null) gueltig.push({ x, y })
    }
    if (gueltig.length < 2) return null
    try {
      const r = lineareRegression(
        gueltig.map((p) => p.x),
        gueltig.map((p) => p.y),
      )
      return { ...r, punkte: gueltig }
    } catch {
      return null
    }
  }, [punkte])

  const xAusY = useMemo(() => {
    if (!regression) return null
    const y = parseDecimal(yMesswert)
    if (y === null || regression.steigung === 0) return null
    return (y - regression.achsenabschnitt) / regression.steigung
  }, [regression, yMesswert])

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14px] text-stone-500">Ausgleichsgerade, Bestimmtheitsmaß, Kalibrierkurve rückwärts</p>

      <div className="flex flex-col gap-2">
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="x- und y-Spalte gemeinsam aus Excel einfügen (je Zeile x TAB y)"
          rows={3}
          className="rounded-xl border border-paper-300 bg-white px-4 py-3 text-base outline-none focus:border-accent-500"
        />
        <button
          onClick={einfuegen}
          className="self-start rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
        >
          Punkte hinzufügen
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {punkte.map((p, i) => (
          <div key={i} className="flex items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-stone-500">
              x
              <input
                type="text"
                inputMode="decimal"
                value={p.x}
                onChange={(e) => punktAendern(i, { x: e.target.value })}
                className="min-w-0 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base"
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-stone-500">
              y
              <input
                type="text"
                inputMode="decimal"
                value={p.y}
                onChange={(e) => punktAendern(i, { y: e.target.value })}
                className="min-w-0 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base"
              />
            </label>
            <button
              onClick={() => punktEntfernen(i)}
              disabled={punkte.length === 1}
              aria-label="Punkt entfernen"
              className="shrink-0 rounded-lg p-2.5 text-stone-400 hover:bg-paper-100 disabled:opacity-30"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <button
          onClick={punktHinzufuegen}
          className="flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent-700 hover:bg-accent-50"
        >
          <Plus size={14} />
          Punkt hinzufügen
        </button>
      </div>

      {!regression && (
        <WarningBanner nachrichten={['Mindestens 2 gültige Punkte mit unterschiedlichen x-Werten eingeben.']} variante="info" />
      )}

      {regression && (
        <>
          <LineChart
            ariaLabel="Messpunkte und Regressionsgerade"
            reihen={[
              {
                label: 'Messpunkte',
                farbe: '#b7791f',
                typ: 'punkte',
                punkte: regression.punkte,
              },
              {
                label: 'Regressionsgerade',
                farbe: '#0f4c5c',
                punkte: (() => {
                  const xs = regression.punkte.map((p) => p.x)
                  const xMin = Math.min(...xs)
                  const xMax = Math.max(...xs)
                  return [
                    { x: xMin, y: regression.steigung * xMin + regression.achsenabschnitt },
                    { x: xMax, y: regression.steigung * xMax + regression.achsenabschnitt },
                  ]
                })(),
              },
            ]}
          />

          <div className="rounded-xl border border-sage-200 bg-sage-50 p-4 text-sm">
            <p className="text-stone-700">
              y = {formatNumber(regression.steigung, 5)}·x + {formatNumber(regression.achsenabschnitt, 5)}
            </p>
            <p className="text-stone-700">R² = {formatNumber(regression.r2, 5)}</p>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-white p-4">
            <h2 className="text-sm font-semibold text-stone-700">Kalibrierkurve rückwärts nutzen</h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-stone-500">Gemessener y-Wert</span>
              <input
                type="text"
                inputMode="decimal"
                value={yMesswert}
                onChange={(e) => setYMesswert(e.target.value)}
                className="rounded-lg border border-paper-300 bg-white px-3 py-2 text-base"
              />
            </label>
            {xAusY !== null && (
              <p className="text-stone-700">
                x = <span className="font-semibold">{formatNumber(xAusY, 5)}</span>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
