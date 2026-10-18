import { useState } from 'react'
import { Plus, Trash2, FlaskConical } from 'lucide-react'
import { GroupedList, GroupedRow } from '../components/GroupedList'
import { BottomSheet } from '../components/BottomSheet'
import { EmptyState } from '../components/EmptyState'
import { SegmentedControl } from '../components/SegmentedControl'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { parseDecimal, formatNumber } from '../lib/format'
import {
  getEigeneStoffe,
  eigenerStoffSpeichern,
  eigenerStoffLoeschen,
  type EigenerStoff,
  type StoffStuetzstelle,
} from '../lib/storage'

interface FormZustand {
  id?: string
  name: string
  quelle: string
  eigenerMesswert: boolean
  modus: 'fest' | 'tabelle'
  dichte: string
  viskositaet: string
  cp: string
  lambda: string
  stuetzstellen: { temperaturC: string; dichte: string; viskositaet: string; cp: string; lambda: string }[]
}

function leereZeile() {
  return { temperaturC: '', dichte: '', viskositaet: '', cp: '', lambda: '' }
}

function leeresFormular(): FormZustand {
  return {
    name: '',
    quelle: '',
    eigenerMesswert: true,
    modus: 'fest',
    dichte: '',
    viskositaet: '',
    cp: '',
    lambda: '',
    stuetzstellen: [leereZeile(), leereZeile()],
  }
}

function stoffZuFormular(s: EigenerStoff): FormZustand {
  return {
    id: s.id,
    name: s.name,
    quelle: s.quelle,
    eigenerMesswert: s.eigenerMesswert,
    modus: s.stuetzstellen && s.stuetzstellen.length > 0 ? 'tabelle' : 'fest',
    dichte: s.dichteKgM3 !== undefined ? String(s.dichteKgM3) : '',
    viskositaet: s.viskositaetPas !== undefined ? String(s.viskositaetPas * 1000) : '',
    cp: s.cpJkgK !== undefined ? String(s.cpJkgK) : '',
    lambda: s.lambdaWmK !== undefined ? String(s.lambdaWmK) : '',
    stuetzstellen:
      s.stuetzstellen && s.stuetzstellen.length > 0
        ? s.stuetzstellen.map((st) => ({
            temperaturC: formatNumber(st.temperaturK - 273.15, 6).replace(',', '.'),
            dichte: st.dichteKgM3 !== undefined ? String(st.dichteKgM3) : '',
            viskositaet: st.viskositaetPas !== undefined ? String(st.viskositaetPas * 1000) : '',
            cp: st.cpJkgK !== undefined ? String(st.cpJkgK) : '',
            lambda: st.lambdaWmK !== undefined ? String(st.lambdaWmK) : '',
          }))
        : [leereZeile(), leereZeile()],
  }
}

export function EigeneStoffe() {
  useSetHeaderTitle('Eigene Stoffdaten')
  const [stoffe, setStoffe] = useState(getEigeneStoffe)
  const [formular, setFormular] = useState<FormZustand | null>(null)

  function speichern() {
    if (!formular || !formular.name.trim()) return
    const basis = {
      id: formular.id,
      name: formular.name.trim(),
      quelle: formular.quelle.trim() || 'ohne Angabe',
      eigenerMesswert: formular.eigenerMesswert,
    }
    let eintrag
    if (formular.modus === 'tabelle') {
      const stuetzstellen: StoffStuetzstelle[] = []
      for (const z of formular.stuetzstellen) {
        const t = parseDecimal(z.temperaturC)
        if (t === null) continue
        const zeile: StoffStuetzstelle = { temperaturK: t + 273.15 }
        const d = parseDecimal(z.dichte)
        const v = parseDecimal(z.viskositaet)
        const c = parseDecimal(z.cp)
        const l = parseDecimal(z.lambda)
        if (d !== null) zeile.dichteKgM3 = d
        if (v !== null) zeile.viskositaetPas = v / 1000
        if (c !== null) zeile.cpJkgK = c
        if (l !== null) zeile.lambdaWmK = l
        stuetzstellen.push(zeile)
      }
      eintrag = { ...basis, stuetzstellen }
    } else {
      const d = parseDecimal(formular.dichte)
      const v = parseDecimal(formular.viskositaet)
      const c = parseDecimal(formular.cp)
      const l = parseDecimal(formular.lambda)
      eintrag = {
        ...basis,
        dichteKgM3: d ?? undefined,
        viskositaetPas: v !== null ? v / 1000 : undefined,
        cpJkgK: c ?? undefined,
        lambdaWmK: l ?? undefined,
      }
    }
    setStoffe(eigenerStoffSpeichern(eintrag))
    setFormular(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setFormular(leeresFormular())}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-accent-600 px-4 py-2.5 text-[14px] font-medium text-ink"
      >
        <Plus size={16} />
        Stoff hinzufügen
      </button>

      {stoffe.length === 0 ? (
        <EmptyState icon={FlaskConical} text="Noch keine eigenen Stoffe angelegt." />
      ) : (
        <GroupedList>
          {stoffe.map((s) => (
            <GroupedRow
              key={s.id}
              label={s.name}
              value={s.eigenerMesswert ? 'Eigener Messwert' : s.quelle}
              onClick={() => setFormular(stoffZuFormular(s))}
            />
          ))}
        </GroupedList>
      )}

      <BottomSheet offen={formular !== null} onClose={() => setFormular(null)} titel={formular?.id ? 'Stoff bearbeiten' : 'Neuer Stoff'}>
        {formular && (
          <div className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-stone-500">Name</span>
              <input
                value={formular.name}
                onChange={(e) => setFormular({ ...formular, name: e.target.value })}
                placeholder="z. B. Glykol-Wasser-Gemisch 30 %"
                className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-stone-500">Quelle / Notiz</span>
              <input
                value={formular.quelle}
                onChange={(e) => setFormular({ ...formular, quelle: e.target.value })}
                placeholder="z. B. eigene Messung, Versuch Okt. 2026"
                className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]"
              />
            </label>

            <label className="flex items-center justify-between gap-2">
              <span className="text-[14px] text-stone-700">Eigener Messwert</span>
              <input
                type="checkbox"
                checked={formular.eigenerMesswert}
                onChange={(e) => setFormular({ ...formular, eigenerMesswert: e.target.checked })}
                className="h-5 w-5 accent-accent-600"
              />
            </label>

            <SegmentedControl
              value={formular.modus}
              onChange={(modus) => setFormular({ ...formular, modus })}
              optionen={[
                { value: 'fest', label: 'Fester Wert' },
                { value: 'tabelle', label: 'Über Temperatur' },
              ]}
            />

            {formular.modus === 'fest' ? (
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-stone-500">Dichte (kg/m³)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formular.dichte}
                    onChange={(e) => setFormular({ ...formular, dichte: e.target.value })}
                    className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-stone-500">Viskosität (mPa·s)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formular.viskositaet}
                    onChange={(e) => setFormular({ ...formular, viskositaet: e.target.value })}
                    className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-stone-500">cp (J/(kg·K))</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formular.cp}
                    onChange={(e) => setFormular({ ...formular, cp: e.target.value })}
                    className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-stone-500">λ (W/(m·K))</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formular.lambda}
                    onChange={(e) => setFormular({ ...formular, lambda: e.target.value })}
                    className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]"
                  />
                </label>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-stone-500">
                  Temperatur in °C, Werte wie oben. Leere Felder in einer Zeile werden übersprungen.
                </p>
                {formular.stuetzstellen.map((z, i) => (
                  <div key={i} className="flex flex-col gap-1.5 rounded-xl bg-paper-100 p-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={z.temperaturC}
                        placeholder="T (°C)"
                        onChange={(e) =>
                          setFormular({
                            ...formular,
                            stuetzstellen: formular.stuetzstellen.map((zz, idx) => (idx === i ? { ...zz, temperaturC: e.target.value } : zz)),
                          })
                        }
                        className="w-20 shrink-0 rounded-lg border border-paper-300 bg-paper-50 px-2 py-1.5 text-[15px]"
                      />
                      <button
                        onClick={() =>
                          setFormular({ ...formular, stuetzstellen: formular.stuetzstellen.filter((_, idx) => idx !== i) })
                        }
                        disabled={formular.stuetzstellen.length <= 1}
                        aria-label="Zeile entfernen"
                        className="ml-auto shrink-0 rounded-lg p-1.5 text-stone-400 disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['dichte', 'viskositaet', 'cp', 'lambda'] as const).map((feld) => (
                        <input
                          key={feld}
                          type="text"
                          inputMode="decimal"
                          value={z[feld]}
                          placeholder={{ dichte: 'ρ kg/m³', viskositaet: 'η mPa·s', cp: 'cp J/(kg·K)', lambda: 'λ W/(m·K)' }[feld]}
                          onChange={(e) =>
                            setFormular({
                              ...formular,
                              stuetzstellen: formular.stuetzstellen.map((zz, idx) => (idx === i ? { ...zz, [feld]: e.target.value } : zz)),
                            })
                          }
                          className="rounded-lg border border-paper-300 bg-paper-50 px-2 py-1.5 text-[14px]"
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setFormular({ ...formular, stuetzstellen: [...formular.stuetzstellen, leereZeile()] })}
                  className="flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-accent-600"
                >
                  <Plus size={14} />
                  Stützstelle hinzufügen
                </button>
              </div>
            )}

            <div className="mt-2 flex gap-2">
              {formular.id && (
                <button
                  onClick={() => {
                    setStoffe(eigenerStoffLoeschen(formular.id!))
                    setFormular(null)
                  }}
                  className="flex-1 rounded-xl bg-red-100 px-4 py-2.5 text-[14px] font-medium text-red-800"
                >
                  Löschen
                </button>
              )}
              <button
                onClick={speichern}
                disabled={!formular.name.trim()}
                className="flex-1 rounded-xl bg-accent-600 px-4 py-2.5 text-[14px] font-medium text-ink disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
