import { useEffect, useId, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { parseDecimal } from '../lib/format'
import type { SchichtFeld } from '../types/formula'

interface Zeile {
  dickeMm: string
  leitfaehigkeit: string
}

const LEERE_ZEILE: Zeile = { dickeMm: '', leitfaehigkeit: '' }

interface Props {
  feld: SchichtFeld
  name: string
  /** Meldet die Summe Σ(s_i/λ_i) in SI (m²·K/W), oder null solange keine vollständige Zeile existiert */
  onSummeChange: (summeSI: number | null) => void
}

export function SchichtenEingabe({ feld, name, onSummeChange }: Props) {
  const [zeilen, setZeilen] = useState<Zeile[]>([LEERE_ZEILE])
  const idBase = useId()

  useEffect(() => {
    const widerstaende: number[] = []
    let hatUnvollstaendigeZeile = false
    for (const z of zeilen) {
      const leer = z.dickeMm.trim() === '' && z.leitfaehigkeit.trim() === ''
      if (leer) continue
      const dicke = parseDecimal(z.dickeMm)
      const lambda = parseDecimal(z.leitfaehigkeit)
      if (dicke === null || lambda === null || lambda <= 0 || dicke < 0) {
        hatUnvollstaendigeZeile = true
        continue
      }
      widerstaende.push(dicke / 1000 / lambda) // mm -> m, dann s/λ
    }
    if (hatUnvollstaendigeZeile || widerstaende.length === 0) {
      onSummeChange(null)
    } else {
      onSummeChange(widerstaende.reduce((a, b) => a + b, 0))
    }
    // onSummeChange ist eine neue Funktion je Render - absichtlich nicht in deps,
    // sonst Endlosschleife; die Elternkomponente übergibt einen stabilen Setter-Aufruf.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zeilen])

  function zeileAendern(i: number, patch: Partial<Zeile>) {
    setZeilen((zs) => zs.map((z, idx) => (idx === i ? { ...z, ...patch } : z)))
  }

  function zeileHinzufuegen() {
    setZeilen((zs) => [...zs, LEERE_ZEILE])
  }

  function zeileEntfernen(i: number) {
    setZeilen((zs) => (zs.length > 1 ? zs.filter((_, idx) => idx !== i) : zs))
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{name}</span>
      <div className="flex flex-col gap-2">
        {zeilen.map((z, i) => (
          <div key={`${idBase}-${i}`} className="flex items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
              {feld.dickeName} (mm)
              <input
                type="text"
                inputMode="decimal"
                value={z.dickeMm}
                onChange={(e) => zeileAendern(i, { dickeMm: e.target.value })}
                placeholder="0"
                className="min-w-0 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base outline-none focus:border-accent-500 dark:border-white/15 dark:bg-white/5"
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
              {feld.leitfaehigkeitName} (W/(m·K))
              <input
                type="text"
                inputMode="decimal"
                value={z.leitfaehigkeit}
                onChange={(e) => zeileAendern(i, { leitfaehigkeit: e.target.value })}
                placeholder="0"
                className="min-w-0 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base outline-none focus:border-accent-500 dark:border-white/15 dark:bg-white/5"
              />
            </label>
            <button
              onClick={() => zeileEntfernen(i)}
              disabled={zeilen.length === 1}
              aria-label="Schicht entfernen"
              className="shrink-0 rounded-lg p-2.5 text-stone-400 hover:bg-paper-100 disabled:opacity-30 dark:hover:bg-white/10"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={zeileHinzufuegen}
        className="flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent-700 hover:bg-accent-50 dark:text-accent-300 dark:hover:bg-accent-900/30"
      >
        <Plus size={14} />
        Schicht hinzufügen
      </button>
    </div>
  )
}
