import { useState } from 'react'
import { SlidersHorizontal, Download, FolderPlus } from 'lucide-react'
import type { Formula, Variable } from '../types/formula'
import { toSI, fromSI } from '../units'
import { parseDecimal, formatNumber } from '../lib/format'
import { parameterstudieBereich, parameterstudieBerechnen, type StudienModus } from '../lib/parameterstudie'
import { csvAusZeilen, csvHerunterladen } from '../lib/csv'
import { getProjekte, projektAnlegen, projektNotizHinzufuegen } from '../lib/storage'
import { BottomSheet } from './BottomSheet'
import { SegmentedControl } from './SegmentedControl'
import { LineChart } from './LineChart'

interface Props {
  formel: Formula
  ziel: string
  eingabeVariablen: Variable[]
  werte: Record<string, string>
  einheiten: Record<string, string>
  ausgabeVariablen: Variable[]
}

/** Parameterstudie: variiert eine Eingabe über einen Bereich, alle übrigen Eingaben bleiben fest. */
export function ParameterstudieSheet({ formel, ziel, eingabeVariablen, werte, einheiten, ausgabeVariablen }: Props) {
  const [offen, setOffen] = useState(false)
  const [variierteId, setVariierteId] = useState(eingabeVariablen[0]?.id ?? '')
  const [von, setVon] = useState('')
  const [bis, setBis] = useState('')
  const [anzahl, setAnzahl] = useState('10')
  const [modus, setModus] = useState<StudienModus>('linear')
  const [zweiteAusgabeId, setZweiteAusgabeId] = useState<string>('')
  const [gespeichertHinweis, setGespeichertHinweis] = useState(false)

  const variable = eingabeVariablen.find((v) => v.id === variierteId)
  const vonZahl = parseDecimal(von)
  const bisZahl = parseDecimal(bis)
  const anzahlZahl = Math.round(parseDecimal(anzahl) ?? 0)
  const einheit = variable ? einheiten[variable.id] ?? variable.defaultUnit : '_'

  let punkte: ReturnType<typeof parameterstudieBerechnen> | null = null
  let fehler: string | null = null
  if (variable && vonZahl !== null && bisZahl !== null && anzahlZahl >= 2) {
    try {
      const bekanntRest: Record<string, number> = {}
      for (const v of eingabeVariablen) {
        if (v.id === variierteId) continue
        const zahl = parseDecimal(werte[v.id] ?? '')
        if (zahl === null) throw new Error(`Bitte zuerst alle anderen Eingaben ausfüllen (${v.name} fehlt).`)
        bekanntRest[v.id] = toSI(zahl, v.dimension, einheiten[v.id] ?? v.defaultUnit)
      }
      const vonSI = toSI(vonZahl, variable.dimension, einheit)
      const bisSI = toSI(bisZahl, variable.dimension, einheit)
      const stuetzwerte = parameterstudieBereich(vonSI, bisSI, anzahlZahl, modus)
      punkte = parameterstudieBerechnen(formel, ziel, variierteId, stuetzwerte, bekanntRest, zweiteAusgabeId || undefined)
    } catch (e) {
      fehler = e instanceof Error ? e.message : 'Parameterstudie konnte nicht berechnet werden.'
    }
  }

  const zielVariable = ausgabeVariablen.find((v) => v.id === ziel)

  function csvExportieren(): void {
    if (!punkte || !variable || !zielVariable) return
    const zweiteVar = ausgabeVariablen.find((v) => v.id === zweiteAusgabeId)
    const header = [variable.name, zielVariable.name, ...(zweiteVar ? [zweiteVar.name] : [])]
    const zeilen = punkte.map((p) => [
      formatNumber(fromSI(p.x, variable.dimension, einheit), 6),
      p.y !== null ? formatNumber(fromSI(p.y, zielVariable.dimension, einheiten[ziel] ?? zielVariable.defaultUnit), 6) : 'außerhalb',
      ...(zweiteVar ? [p.y2 !== null ? formatNumber(fromSI(p.y2, zweiteVar.dimension, einheiten[zweiteVar.id] ?? zweiteVar.defaultUnit), 6) : 'außerhalb'] : []),
    ])
    csvHerunterladen(`parameterstudie-${formel.id}-${variierteId}.csv`, csvAusZeilen(header, zeilen))
  }

  function imProjektSpeichern(): void {
    if (!punkte || !variable || !zielVariable) return
    const projekte = getProjekte()
    const projekt = projekte[0] ?? projektAnlegen(`Parameterstudie ${formel.name}`, '')
    const zeilenText = punkte
      .map((p) =>
        `${formatNumber(fromSI(p.x, variable.dimension, einheit), 6)} ${einheit} -> ${
          p.y !== null ? formatNumber(fromSI(p.y, zielVariable.dimension, einheiten[ziel] ?? zielVariable.defaultUnit), 6) : 'außerhalb'
        }`,
      )
      .join('\n')
    projektNotizHinzufuegen(
      projekt.id,
      `Parameterstudie ${formel.name}: ${variable.name} variiert, Ergebnis ${zielVariable.name}:\n${zeilenText}`,
    )
    setGespeichertHinweis(true)
    setTimeout(() => setGespeichertHinweis(false), 1500)
  }

  return (
    <>
      <button
        onClick={() => setOffen(true)}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-paper-200 px-4 py-2.5 text-[14px] font-medium text-stone-700"
      >
        <SlidersHorizontal size={16} />
        Parameterstudie
      </button>

      <BottomSheet offen={offen} onClose={() => setOffen(false)} titel="Parameterstudie">
        <div className="flex flex-col gap-4 px-4 pb-8 pt-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-stone-500">Eingabe variieren</span>
            <div className="flex flex-wrap gap-2">
              {eingabeVariablen.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariierteId(v.id)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${
                    variierteId === v.id ? 'bg-accent-600 text-ink' : 'bg-paper-200 text-stone-600'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[12px] text-stone-500">Von ({einheit})</label>
              <input
                value={von}
                onChange={(e) => setVon(e.target.value)}
                inputMode="decimal"
                className="rounded-lg border border-paper-300 bg-paper-200 px-3 py-2 text-[16px]"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[12px] text-stone-500">Bis ({einheit})</label>
              <input
                value={bis}
                onChange={(e) => setBis(e.target.value)}
                inputMode="decimal"
                className="rounded-lg border border-paper-300 bg-paper-200 px-3 py-2 text-[16px]"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[12px] text-stone-500">Anzahl Punkte</label>
              <input
                value={anzahl}
                onChange={(e) => setAnzahl(e.target.value)}
                inputMode="numeric"
                className="rounded-lg border border-paper-300 bg-paper-200 px-3 py-2 text-[16px]"
              />
            </div>
            <div className="flex flex-[2] flex-col gap-1">
              <label className="text-[12px] text-stone-500">Verteilung</label>
              <SegmentedControl
                value={modus}
                onChange={setModus}
                optionen={[
                  { value: 'linear', label: 'Linear' },
                  { value: 'log', label: 'Logarithmisch' },
                ]}
              />
            </div>
          </div>

          {ausgabeVariablen.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-stone-500">Zweite Ausgabe (optional)</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setZweiteAusgabeId('')}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${zweiteAusgabeId === '' ? 'bg-accent-600 text-ink' : 'bg-paper-200 text-stone-600'}`}
                >
                  Keine
                </button>
                {ausgabeVariablen
                  .filter((v) => v.id !== ziel)
                  .map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setZweiteAusgabeId(v.id)}
                      className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${zweiteAusgabeId === v.id ? 'bg-accent-600 text-ink' : 'bg-paper-200 text-stone-600'}`}
                    >
                      {v.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {fehler && <p className="rounded-xl bg-red-50 p-2.5 text-sm text-red-800">{fehler}</p>}

          {punkte && zielVariable && (
            <div className="flex flex-col gap-3">
              <LineChart
                ariaLabel={`Parameterstudie: ${zielVariable.name} über ${variable!.name}`}
                reihen={[
                  {
                    label: zielVariable.name,
                    farbe: '#c8a86b',
                    punkte: punkte
                      .filter((p) => p.y !== null)
                      .map((p) => ({
                        x: fromSI(p.x, variable!.dimension, einheit),
                        y: fromSI(p.y!, zielVariable.dimension, einheiten[ziel] ?? zielVariable.defaultUnit),
                      })),
                  },
                ]}
              />
              <div className="overflow-x-auto rounded-xl bg-paper-200">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-stone-500">
                      <th className="px-2.5 py-1.5">{variable!.name}</th>
                      <th className="px-2.5 py-1.5">{zielVariable.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {punkte.map((p, i) => (
                      <tr key={i} className="border-t border-paper-300">
                        <td className="px-2.5 py-1.5 tabular-nums">{formatNumber(fromSI(p.x, variable!.dimension, einheit), 4)}</td>
                        <td className="px-2.5 py-1.5 tabular-nums">
                          {p.y !== null
                            ? formatNumber(fromSI(p.y, zielVariable.dimension, einheiten[ziel] ?? zielVariable.defaultUnit), 4)
                            : `— (${p.hinweis ?? 'außerhalb'})`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={csvExportieren} className="flex items-center gap-1.5 rounded-lg bg-paper-200 px-3 py-2 text-[13px] font-medium text-stone-700">
                  <Download size={14} />
                  CSV exportieren
                </button>
                <button onClick={imProjektSpeichern} className="flex items-center gap-1.5 rounded-lg bg-paper-200 px-3 py-2 text-[13px] font-medium text-stone-700">
                  <FolderPlus size={14} />
                  {gespeichertHinweis ? 'Gespeichert' : 'Im Projekt speichern'}
                </button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  )
}
