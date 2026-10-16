import { useMemo, useState } from 'react'
import { alleFormeln } from '../formulas/registry'
import type { Formula, Variable } from '../types/formula'
import { toSI, fromSI, dimensions } from '../units'
import { parseDecimal, formatNumber } from '../lib/format'
import { SearchBar } from '../components/SearchBar'
import { WarningBanner } from '../components/WarningBanner'
import { fehlerfortpflanzung } from '../lib/fehlerfortpflanzung'

/**
 * Generische Gaußsche Fehlerfortpflanzung über eine beliebige Formel der
 * Registry: ∂f/∂x_i wird numerisch per zentralem Differenzenquotienten
 * bestimmt, die kombinierte Unsicherheit über
 * u_f = sqrt(Σ (∂f/∂x_i · u_i)²) gebildet.
 */

interface Eingabe {
  wertText: string
  unsicherheitText: string
  einheit: string
}

/** Lokaler Skalierungsfaktor einer (ggf. affinen) Einheitenumrechnung - für Unsicherheiten
 * zählt nur die Steigung, nicht der Offset (z. B. bei °C -> K). */
function einheitenSkalierung(dimension: Variable['dimension'], einheit: string): number {
  return toSI(1, dimension, einheit) - toSI(0, dimension, einheit)
}

export function Fehlerfortpflanzung() {
  const [suche, setSuche] = useState('')
  const [formel, setFormel] = useState<Formula | null>(null)
  const [ziel, setZiel] = useState<string>('')
  const [eingaben, setEingaben] = useState<Record<string, Eingabe>>({})

  const treffer = useMemo(() => {
    const q = suche.trim().toLowerCase()
    if (!q) return []
    return alleFormeln
      .filter((f) => [f.name, f.kategorie, ...f.stichworte].join(' ').toLowerCase().includes(q))
      .slice(0, 8)
  }, [suche])

  function formelWaehlen(f: Formula) {
    setFormel(f)
    setZiel(f.zielgroessen[0])
    const initial: Record<string, Eingabe> = {}
    const ausgabeIds = new Set([f.zielgroessen[0], ...(f.zusatzAusgaben ?? [])])
    for (const v of f.variablen) {
      if (!ausgabeIds.has(v.id)) initial[v.id] = { wertText: '', unsicherheitText: '', einheit: v.defaultUnit }
    }
    setEingaben(initial)
    setSuche('')
  }

  const eingabeVariablen = useMemo(() => {
    if (!formel) return []
    const ausgabeIds = new Set([ziel, ...(formel.zusatzAusgaben ?? [])])
    return formel.variablen.filter((v) => !ausgabeIds.has(v.id))
  }, [formel, ziel])

  function zielWaehlen(neuesZiel: string) {
    if (!formel) return
    setZiel(neuesZiel)
    const ausgabeIds = new Set([neuesZiel, ...(formel.zusatzAusgaben ?? [])])
    setEingaben((alt) => {
      const neu: Record<string, Eingabe> = {}
      for (const v of formel.variablen) {
        if (!ausgabeIds.has(v.id)) neu[v.id] = alt[v.id] ?? { wertText: '', unsicherheitText: '', einheit: v.defaultUnit }
      }
      return neu
    })
  }

  const ergebnis = useMemo(() => {
    if (!formel) return null
    const werteSI: Record<string, number> = {}
    const unsicherheitenSI: Record<string, number> = {}
    for (const v of eingabeVariablen) {
      const e = eingaben[v.id]
      if (!e) return null
      const wert = parseDecimal(e.wertText)
      const unsicherheit = parseDecimal(e.unsicherheitText)
      if (wert === null || unsicherheit === null || unsicherheit < 0) return null
      werteSI[v.id] = toSI(wert, v.dimension, e.einheit)
      unsicherheitenSI[v.id] = unsicherheit * einheitenSkalierung(v.dimension, e.einheit)
    }

    try {
      const r = fehlerfortpflanzung((b) => formel.compute(b, ziel)[ziel], werteSI, unsicherheitenSI)
      const beitraege = r.beitraege.map((b) => ({
        id: b.id,
        name: eingabeVariablen.find((v) => v.id === b.id)?.name ?? b.id,
        beitragSI: b.beitrag,
      }))
      return { basis: r.basis, kombinierteUnsicherheitSI: r.kombinierteUnsicherheit, beitraege }
    } catch {
      return null
    }
  }, [formel, ziel, eingaben, eingabeVariablen])

  const zielVariable = formel?.variablen.find((v) => v.id === ziel)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Fehlerfortpflanzung</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Gaußsche Fehlerfortpflanzung für jede Formel der Registry
        </p>
      </div>

      <SearchBar value={suche} onChange={setSuche} placeholder="Formel suchen…" />
      {treffer.length > 0 && (
        <div className="flex flex-col gap-1">
          {treffer.map((f) => (
            <button
              key={f.id}
              onClick={() => formelWaehlen(f)}
              className="rounded-lg border border-paper-300 bg-white px-3 py-2 text-left text-sm hover:border-accent-300 dark:border-white/10 dark:bg-white/5"
            >
              <span className="font-medium text-stone-900 dark:text-stone-100">{f.name}</span>
              <span className="ml-2 text-xs text-stone-500 dark:text-stone-400">{f.kategorie}</span>
            </button>
          ))}
        </div>
      )}

      {formel && (
        <>
          <div className="rounded-xl border border-paper-300 bg-white p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{formel.name}</p>
            {formel.zielgroessen.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formel.zielgroessen.map((zId) => (
                  <button
                    key={zId}
                    onClick={() => zielWaehlen(zId)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      ziel === zId ? 'bg-accent-600 text-white' : 'bg-paper-100 text-stone-600 dark:bg-white/10 dark:text-stone-300'
                    }`}
                  >
                    {formel.variablen.find((v) => v.id === zId)?.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {eingabeVariablen.map((v) => {
              const e = eingaben[v.id] ?? { wertText: '', unsicherheitText: '', einheit: v.defaultUnit }
              const dim = dimensions[v.dimension]
              return (
                <div key={v.id} className="flex flex-col gap-1.5 rounded-xl border border-paper-300 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{v.name}</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Wert"
                      value={e.wertText}
                      onChange={(ev) => setEingaben((eg) => ({ ...eg, [v.id]: { ...e, wertText: ev.target.value } }))}
                      className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base dark:border-white/15 dark:bg-white/5"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="± Unsicherheit"
                      value={e.unsicherheitText}
                      onChange={(ev) => setEingaben((eg) => ({ ...eg, [v.id]: { ...e, unsicherheitText: ev.target.value } }))}
                      className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base dark:border-white/15 dark:bg-white/5"
                    />
                    {dim.units.length > 1 ? (
                      <select
                        value={e.einheit}
                        onChange={(ev) => setEingaben((eg) => ({ ...eg, [v.id]: { ...e, einheit: ev.target.value } }))}
                        className="rounded-lg border border-paper-300 bg-white px-2 text-sm dark:border-white/15 dark:bg-white/5"
                      >
                        {dim.units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="flex items-center px-1 text-sm text-stone-500 dark:text-stone-400">{dim.units[0]?.label}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {!ergebnis && (
            <WarningBanner nachrichten={['Für alle Eingaben Wert und Unsicherheit (≥ 0) angeben.']} variante="info" />
          )}

          {ergebnis && zielVariable && (
            <div className="rounded-2xl border border-sage-200 bg-sage-50 p-4 dark:border-sage-800/60 dark:bg-sage-900/20">
              <p className="text-sm font-medium text-sage-700 dark:text-sage-300">{zielVariable.name}</p>
              <p className="text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                {formatNumber(fromSI(ergebnis.basis, zielVariable.dimension, zielVariable.defaultUnit), 5)}
                {' ± '}
                {formatNumber(
                  ergebnis.kombinierteUnsicherheitSI * (1 / einheitenSkalierung(zielVariable.dimension, zielVariable.defaultUnit)),
                  5,
                )}{' '}
                {dimensions[zielVariable.dimension].units.find((u) => u.id === zielVariable.defaultUnit)?.label}
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs font-medium text-stone-600 dark:text-stone-400">Beitrag je Eingabe zur Gesamtunsicherheit</p>
                {ergebnis.beitraege.map((b) => {
                  const anteil =
                    ergebnis.kombinierteUnsicherheitSI > 0 ? (b.beitragSI ** 2 / ergebnis.kombinierteUnsicherheitSI ** 2) * 100 : 0
                  return (
                    <div key={b.id} className="flex flex-col gap-0.5">
                      <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                        <span>{b.name}</span>
                        <span className="tabular-nums">{formatNumber(anteil, 3)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-paper-200 dark:bg-white/10">
                        <div className="h-full rounded-full bg-accent-500" style={{ width: `${anteil}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
