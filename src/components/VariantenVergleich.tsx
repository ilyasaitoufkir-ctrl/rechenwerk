import { useState } from 'react'
import { Columns3, Plus, Trash2, FolderPlus, Printer } from 'lucide-react'
import type { Formula, Variable } from '../types/formula'
import { toSI, fromSI } from '../units'
import { parseDecimal, formatNumber } from '../lib/format'
import { getProjekte, projektAnlegen, projektBerechnungHinzufuegen } from '../lib/storage'
import { BottomSheet } from './BottomSheet'

interface Variante {
  label: string
  eingaben: { variable: Variable; wertAnzeige: string; einheit: string }[]
  ergebnisSI: number
  zielVariable: Variable
}

interface Props {
  formel: Formula
  ziel: string
  eingabeVariablen: Variable[]
  werte: Record<string, string>
  einheiten: Record<string, string>
  ergebnisSI: Record<string, number> | null
}

const LABELS = ['A', 'B', 'C']

/** Vergleicht bis zu drei Varianten (A/B/C) derselben Formel nebeneinander - jede Variante ist ein Schnappschuss der aktuellen Eingaben/des Ergebnisses. */
export function VariantenVergleich({ formel, ziel, eingabeVariablen, werte, einheiten, ergebnisSI }: Props) {
  const [offen, setOffen] = useState(false)
  const [varianten, setVarianten] = useState<Variante[]>([])
  const [gespeichertHinweis, setGespeichertHinweis] = useState(false)

  const zielVariable = formel.variablen.find((v) => v.id === ziel)!

  function hinzufuegen(): void {
    if (!ergebnisSI || varianten.length >= 3) return
    const eingaben = eingabeVariablen.map((v) => ({ variable: v, wertAnzeige: werte[v.id] ?? '', einheit: einheiten[v.id] ?? v.defaultUnit }))
    setVarianten((vs) => [...vs, { label: LABELS[vs.length], eingaben, ergebnisSI: ergebnisSI[ziel], zielVariable }])
    setOffen(true)
  }

  function entfernen(i: number): void {
    setVarianten((vs) => vs.filter((_, idx) => idx !== i).map((v, idx) => ({ ...v, label: LABELS[idx] })))
  }

  function imProjektSpeichern(): void {
    const projekte = getProjekte()
    const projekt = projekte[0] ?? projektAnlegen(`Varianten ${formel.name}`, '')
    for (const v of varianten) {
      const bekannt: Record<string, number> = {}
      for (const e of v.eingaben) {
        const zahl = parseDecimal(e.wertAnzeige)
        if (zahl !== null) bekannt[e.variable.id] = toSI(zahl, e.variable.dimension, e.einheit)
      }
      projektBerechnungHinzufuegen(projekt.id, {
        formelId: formel.id,
        formelName: `${formel.name} (Variante ${v.label})`,
        kategorie: formel.kategorie,
        bekannt,
        ziel,
        ergebnis: { [ziel]: v.ergebnisSI },
        quelle: formel.quelle,
        verifiziert: false,
        richtwert: formel.richtwert ?? false,
        zeitpunkt: Date.now(),
      })
    }
    setGespeichertHinweis(true)
    setTimeout(() => setGespeichertHinweis(false), 1500)
  }

  // Zeilen: eine je Variable (alle Eingaben der ersten Variante als Referenz, da alle Varianten dieselbe Formel haben).
  const variablenZeilen = varianten[0]?.eingaben.map((e) => e.variable) ?? []

  function istAbweichend(variableId: string): boolean {
    const werteDerVariablen = varianten.map((v) => v.eingaben.find((e) => e.variable.id === variableId)?.wertAnzeige)
    return new Set(werteDerVariablen).size > 1
  }

  return (
    <>
      <button
        onClick={() => (varianten.length > 0 ? setOffen(true) : hinzufuegen())}
        disabled={!ergebnisSI}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-paper-200 px-4 py-2.5 text-[14px] font-medium text-stone-700 disabled:opacity-40"
      >
        <Columns3 size={16} />
        Variante hinzufügen
      </button>

      <BottomSheet offen={offen} onClose={() => setOffen(false)} titel="Varianten A/B/C">
        <div className="druckbericht flex flex-col gap-4 px-4 pb-8 pt-2">
          {varianten.length === 0 && <p className="text-[14px] text-stone-500">Noch keine Variante gespeichert.</p>}

          {varianten.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr>
                    <th className="px-1.5 py-1 text-left text-stone-500">Größe</th>
                    {varianten.map((v, i) => (
                      <th key={i} className="px-1.5 py-1 text-right text-stone-500">
                        {v.label}
                        <button onClick={() => entfernen(i)} aria-label={`Variante ${v.label} entfernen`} className="no-print ml-1 text-stone-400">
                          <Trash2 size={12} className="inline" />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {variablenZeilen.map((variable) => (
                    <tr key={variable.id} className="border-t border-paper-300">
                      <td className="px-1.5 py-1.5 text-stone-700">{variable.name}</td>
                      {varianten.map((v, i) => {
                        const e = v.eingaben.find((x) => x.variable.id === variable.id)!
                        const abweichend = istAbweichend(variable.id)
                        return (
                          <td key={i} className={`px-1.5 py-1.5 text-right tabular-nums ${abweichend ? 'font-semibold text-accent-600' : 'text-stone-600'}`}>
                            {e.wertAnzeige} {e.einheit}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr className="border-t border-paper-300 font-semibold">
                    <td className="px-1.5 py-1.5 text-stone-800">{zielVariable.name}</td>
                    {varianten.map((v, i) => {
                      const einheit = v.zielVariable.defaultUnit
                      const wertAnzeige = fromSI(v.ergebnisSI, v.zielVariable.dimension, einheit)
                      const abweichungProzent = i > 0 && varianten[0].ergebnisSI !== 0 ? ((v.ergebnisSI - varianten[0].ergebnisSI) / varianten[0].ergebnisSI) * 100 : null
                      return (
                        <td key={i} className="px-1.5 py-1.5 text-right tabular-nums text-stone-900">
                          {formatNumber(wertAnzeige, 4)} {einheit}
                          {abweichungProzent !== null && (
                            <span className="block text-[11px] font-normal text-stone-500">
                              {abweichungProzent >= 0 ? '+' : ''}
                              {formatNumber(abweichungProzent, 3)}% ggü. A
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="no-print flex flex-wrap gap-2">
            <button
              onClick={hinzufuegen}
              disabled={!ergebnisSI || varianten.length >= 3}
              className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-2 text-[13px] font-medium text-ink disabled:opacity-40"
            >
              <Plus size={14} />
              Aktuelle Eingabe als Variante {LABELS[varianten.length] ?? ''} hinzufügen
            </button>
            {varianten.length > 0 && (
              <>
                <button onClick={imProjektSpeichern} className="flex items-center gap-1.5 rounded-lg bg-paper-200 px-3 py-2 text-[13px] font-medium text-stone-700">
                  <FolderPlus size={14} />
                  {gespeichertHinweis ? 'Gespeichert' : 'Im Projekt speichern'}
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg bg-paper-200 px-3 py-2 text-[13px] font-medium text-stone-700">
                  <Printer size={14} />
                  Als PDF / drucken
                </button>
              </>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
