import { useEffect, useId, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { parseDecimal } from '../lib/format'
import { toSI, dimensions } from '../units'
import type { KomponentenFeld } from '../types/formula'
import { UnitChip } from './UnitChip'
import { UnitPickerSheet } from './UnitPickerSheet'

type Zeile = Record<string, { wert: string; einheit: string }>

function leereZeile(feld: KomponentenFeld): Zeile {
  const z: Zeile = {}
  for (const s of feld.spalten) z[s.id] = { wert: '', einheit: s.defaultUnit }
  return z
}

interface Props {
  feld: KomponentenFeld
  /** Meldet die berechneten Summen in SI, oder null solange keine vollständige Zeile existiert */
  onSummenChange: (summenSI: Record<string, number> | null) => void
}

export function KomponentenEingabe({ feld, onSummenChange }: Props) {
  const [zeilen, setZeilen] = useState<Zeile[]>([leereZeile(feld), leereZeile(feld)])
  const [offenesSheet, setOffenesSheet] = useState<{ zeile: number; spalte: string } | null>(null)
  const idBase = useId()

  useEffect(() => {
    const gueltigeZeilenSI: Record<string, number>[] = []
    let hatUnvollstaendigeZeile = false

    for (const zeile of zeilen) {
      const texte = feld.spalten.map((s) => zeile[s.id]?.wert ?? '')
      const istLeer = texte.every((t) => t.trim() === '')
      if (istLeer) continue

      const zeileSI: Record<string, number> = {}
      let zeileGueltig = true
      for (const s of feld.spalten) {
        const text = zeile[s.id]?.wert ?? ''
        const zahl = parseDecimal(text)
        if (zahl === null) {
          zeileGueltig = false
          break
        }
        zeileSI[s.id] = toSI(zahl, s.dimension, zeile[s.id]?.einheit ?? s.defaultUnit)
      }
      if (!zeileGueltig) {
        hatUnvollstaendigeZeile = true
        continue
      }
      gueltigeZeilenSI.push(zeileSI)
    }

    if (hatUnvollstaendigeZeile || gueltigeZeilenSI.length === 0) {
      onSummenChange(null)
      return
    }

    const summen: Record<string, number> = {}
    for (const s of feld.summen) {
      summen[s.zielVariable] = gueltigeZeilenSI.reduce(
        (sum, zeile) => sum + s.spalten.reduce((prod, spalteId) => prod * zeile[spalteId], 1),
        0,
      )
    }
    onSummenChange(summen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zeilen])

  function zeileAendern(i: number, spalteId: string, patch: Partial<{ wert: string; einheit: string }>) {
    setZeilen((zs) =>
      zs.map((z, idx) => (idx === i ? { ...z, [spalteId]: { ...z[spalteId], ...patch } } : z)),
    )
  }

  function zeileHinzufuegen() {
    setZeilen((zs) => [...zs, leereZeile(feld)])
  }

  function zeileEntfernen(i: number) {
    setZeilen((zs) => (zs.length > 1 ? zs.filter((_, idx) => idx !== i) : zs))
  }

  const sheetSpalte = offenesSheet ? feld.spalten.find((s) => s.id === offenesSheet.spalte) : undefined

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[15px] font-medium text-stone-700">Komponenten</span>
      <div className="flex flex-col gap-3">
        {zeilen.map((zeile, i) => (
          <div key={`${idBase}-${i}`} className="flex items-end gap-2 rounded-xl bg-paper-100 p-2">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              {feld.spalten.map((s) => (
                <label key={s.id} className="flex min-w-[6rem] flex-1 flex-col gap-1 text-[12px] text-stone-500">
                  {s.name}
                  <div className="flex gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={zeile[s.id]?.wert ?? ''}
                      onChange={(e) => zeileAendern(i, s.id, { wert: e.target.value })}
                      placeholder="0"
                      className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-white px-2 py-2 text-[16px] outline-none focus:border-accent-500"
                    />
                    {dimensions[s.dimension].units.length > 1 ? (
                      <UnitChip
                        label={
                          dimensions[s.dimension].units.find((u) => u.id === (zeile[s.id]?.einheit ?? s.defaultUnit))
                            ?.label ?? s.defaultUnit
                        }
                        onClick={() => setOffenesSheet({ zeile: i, spalte: s.id })}
                      />
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={() => zeileEntfernen(i)}
              disabled={zeilen.length === 1}
              aria-label="Komponente entfernen"
              className="shrink-0 rounded-lg p-2.5 text-stone-400 disabled:opacity-30"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={zeileHinzufuegen}
        className="flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-accent-700"
      >
        <Plus size={14} />
        Komponente hinzufügen
      </button>

      <UnitPickerSheet
        offen={offenesSheet !== null}
        onClose={() => setOffenesSheet(null)}
        einheiten={sheetSpalte ? dimensions[sheetSpalte.dimension].units : []}
        ausgewaehlt={offenesSheet ? (zeilen[offenesSheet.zeile]?.[offenesSheet.spalte]?.einheit ?? '') : ''}
        onSelect={(e) => {
          if (offenesSheet) zeileAendern(offenesSheet.zeile, offenesSheet.spalte, { einheit: e })
        }}
        titel={sheetSpalte?.name}
      />
    </div>
  )
}
