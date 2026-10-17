import { useMemo, useState } from 'react'
import { dimensions, type DimensionId, dynamicToKinematic, toSI, fromSI } from '../units'
import { parseDecimal, formatNumber } from '../lib/format'
import { useEinstellungen } from '../hooks/useEinstellungen'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { UnitChip } from '../components/UnitChip'
import { UnitPickerSheet } from '../components/UnitPickerSheet'

const DIMENSION_REIHENFOLGE: DimensionId[] = [
  'length',
  'area',
  'volume',
  'mass',
  'time',
  'temperature',
  'temperatureDelta',
  'pressure',
  'volumeFlow',
  'massFlow',
  'density',
  'dynamicViscosity',
  'kinematicViscosity',
  'energy',
  'power',
  'specificHeatCapacity',
  'velocity',
]

export function UnitConverter() {
  useSetHeaderTitle('Einheitenumrechner')
  const [dimensionId, setDimensionId] = useState<DimensionId>('pressure')
  const [eingabe, setEingabe] = useState('1')
  const [vonEinheit, setVonEinheit] = useState('bar')
  const [nachEinheit, setNachEinheit] = useState('Pa')
  const [eingabeTyp, setEingabeTyp] = useState<'absolut' | 'ueberdruck'>('absolut')
  const [ausgabeTyp, setAusgabeTyp] = useState<'absolut' | 'ueberdruck'>('absolut')
  const [vonSheetOffen, setVonSheetOffen] = useState(false)
  const [nachSheetOffen, setNachSheetOffen] = useState(false)
  const { ambientDruckPa, ambientAendern } = useEinstellungen()

  const dim = dimensions[dimensionId]

  function dimensionWechseln(id: DimensionId) {
    setDimensionId(id)
    const d = dimensions[id]
    setVonEinheit(d.units[0]?.id ?? '')
    setNachEinheit(d.units[1]?.id ?? d.units[0]?.id ?? '')
  }

  const zahl = parseDecimal(eingabe)
  const ergebnis = useMemo(() => {
    if (zahl === null) return null
    try {
      let siAbsolut = toSI(zahl, dimensionId, vonEinheit)
      if (dimensionId === 'pressure' && eingabeTyp === 'ueberdruck') {
        siAbsolut += ambientDruckPa
      }
      let ausgabeSI = siAbsolut
      if (dimensionId === 'pressure' && ausgabeTyp === 'ueberdruck') {
        ausgabeSI = siAbsolut - ambientDruckPa
      }
      return fromSI(ausgabeSI, dimensionId, nachEinheit)
    } catch {
      return null
    }
  }, [zahl, dimensionId, vonEinheit, nachEinheit, eingabeTyp, ausgabeTyp, ambientDruckPa])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {DIMENSION_REIHENFOLGE.map((id) => (
          <button
            key={id}
            onClick={() => dimensionWechseln(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              dimensionId === id
                ? 'bg-accent-600 text-white'
                : 'bg-paper-200 text-stone-600'
            }`}
          >
            {dimensions[id].label}
          </button>
        ))}
      </div>

      {dimensionId === 'pressure' && (
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-3">
          <DruckTypAuswahl label="Eingabe ist" wert={eingabeTyp} onChange={setEingabeTyp} />
          <DruckTypAuswahl label="Ausgabe ist" wert={ausgabeTyp} onChange={setAusgabeTyp} />
          <label className="flex items-center justify-between gap-2 text-sm text-stone-600">
            Umgebungsdruck (Pa)
            <input
              type="text"
              inputMode="decimal"
              value={ambientDruckPa}
              onChange={(e) => {
                const v = parseDecimal(e.target.value)
                if (v !== null) ambientAendern(v)
              }}
              className="w-28 rounded-lg border border-paper-300 bg-white px-2 py-1 text-right"
            />
          </label>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={eingabe}
            onChange={(e) => setEingabe(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-paper-300 bg-white px-4 py-3 text-lg outline-none focus:border-accent-500"
          />
          <UnitChip label={dim.units.find((u) => u.id === vonEinheit)?.label ?? vonEinheit} onClick={() => setVonSheetOffen(true)} />
        </div>

        <div className="flex items-center justify-center text-stone-400">=</div>

        <div className="flex gap-2 rounded-2xl bg-accent-100 px-4 py-3">
          <span className="min-w-0 flex-1 overflow-x-auto text-[22px] font-semibold tabular-nums text-accent-900">
            {ergebnis === null ? '—' : formatNumber(ergebnis, 6)}
          </span>
          <UnitChip label={dim.units.find((u) => u.id === nachEinheit)?.label ?? nachEinheit} onClick={() => setNachSheetOffen(true)} />
        </div>
      </div>

      <UnitPickerSheet
        offen={vonSheetOffen}
        onClose={() => setVonSheetOffen(false)}
        einheiten={dim.units}
        ausgewaehlt={vonEinheit}
        onSelect={setVonEinheit}
        titel="Von"
      />
      <UnitPickerSheet
        offen={nachSheetOffen}
        onClose={() => setNachSheetOffen(false)}
        einheiten={dim.units}
        ausgewaehlt={nachEinheit}
        onSelect={setNachEinheit}
        titel="Nach"
      />

      <ViskositaetsUmrechner />
    </div>
  )
}

function DruckTypAuswahl({
  label,
  wert,
  onChange,
}: {
  label: string
  wert: 'absolut' | 'ueberdruck'
  onChange: (v: 'absolut' | 'ueberdruck') => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-stone-600">{label}</span>
      <div className="flex gap-2">
        {(['absolut', 'ueberdruck'] as const).map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              wert === m
                ? 'bg-accent-600 text-white'
                : 'bg-paper-200 text-stone-600'
            }`}
          >
            {m === 'absolut' ? 'Absolut' : 'Überdruck'}
          </button>
        ))}
      </div>
    </div>
  )
}

function ViskositaetsUmrechner() {
  const [eta, setEta] = useState('1')
  const [rho, setRho] = useState('1000')

  const etaZahl = parseDecimal(eta)
  const rhoZahl = parseDecimal(rho)
  const nu =
    etaZahl !== null && rhoZahl !== null && rhoZahl > 0
      ? dynamicToKinematic(etaZahl * 1e-3, rhoZahl)
      : null

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4">
      <h2 className="text-sm font-semibold text-stone-700">
        Dynamisch → kinematisch (ν = η / ρ)
      </h2>
      <div className="flex gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-stone-500">
          η (mPa·s)
          <input
            type="text"
            inputMode="decimal"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
            className="min-w-0 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base"
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-stone-500">
          ρ (kg/m³)
          <input
            type="text"
            inputMode="decimal"
            value={rho}
            onChange={(e) => setRho(e.target.value)}
            className="min-w-0 rounded-lg border border-paper-300 bg-white px-3 py-2 text-base"
          />
        </label>
      </div>
      <p className="text-sm text-stone-700">
        ν ={' '}
        {nu !== null ? (
          <span className="font-semibold tabular-nums">{formatNumber(nu * 1e6, 6)} mm²/s</span>
        ) : (
          '—'
        )}
      </p>
    </div>
  )
}
