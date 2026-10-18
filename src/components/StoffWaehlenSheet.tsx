import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { BottomSheet } from './BottomSheet'
import { getEigeneStoffe } from '../lib/storage'
import { stoffwertBeiTemperatur, type StoffEigenschaft } from '../lib/stoffinterpolation'

interface Props {
  offen: boolean
  onClose: () => void
  eigenschaft: StoffEigenschaft
  /** wertSI in der SI-Basiseinheit der Eigenschaft (kg/m³, Pa·s, J/(kg·K), W/(m·K)) */
  onSelect: (wertSI: number) => void
}

/** Bottom Sheet zum Einsetzen eines eigenen Stoffwerts in ein Eingabefeld - aus FeldEingabe.tsx aufrufbar. */
export function StoffWaehlenSheet({ offen, onClose, eigenschaft, onSelect }: Props) {
  const stoffe = getEigeneStoffe().filter((s) => stoffwertBeiTemperatur(s, eigenschaft, 293.15) !== null)
  const [temperaturFuer, setTemperaturFuer] = useState<string | null>(null)
  const [temperaturC, setTemperaturC] = useState('20')
  const [hinweis, setHinweis] = useState<string | null>(null)

  function uebernehmen(stoffId: string): void {
    const stoff = stoffe.find((s) => s.id === stoffId)
    if (!stoff) return
    if (stoff.stuetzstellen && stoff.stuetzstellen.length > 0) {
      setTemperaturFuer(stoffId)
      setHinweis(null)
      return
    }
    const ergebnis = stoffwertBeiTemperatur(stoff, eigenschaft, 293.15)
    if (!ergebnis) return
    onSelect(ergebnis.wert)
    onClose()
  }

  function temperaturUebernehmen(stoffId: string): void {
    const stoff = stoffe.find((s) => s.id === stoffId)
    const tC = Number(temperaturC.replace(',', '.'))
    if (!stoff || !Number.isFinite(tC)) return
    const ergebnis = stoffwertBeiTemperatur(stoff, eigenschaft, tC + 273.15)
    if (!ergebnis) {
      setHinweis('Für diese Eigenschaft liegen keine Stützstellen vor.')
      return
    }
    onSelect(ergebnis.wert)
    if (ergebnis.ausserhalbBereich) {
      // Wert wird trotzdem übernommen (Randwert) - Sheet bleibt offen, damit die Warnung sichtbar bleibt.
      setHinweis('Temperatur liegt außerhalb der gemessenen Stützstellen - Randwert wurde übernommen, bitte prüfen.')
      return
    }
    setTemperaturFuer(null)
    onClose()
  }

  return (
    <BottomSheet offen={offen} onClose={onClose} titel="Eigenen Stoff wählen">
      <div className="flex flex-col gap-2 px-4 pb-6 pt-2">
        {stoffe.length === 0 && (
          <p className="py-4 text-center text-[14px] text-stone-500">
            Kein eigener Stoff mit dieser Eigenschaft hinterlegt (Einstellungen → Eigene Stoffdaten).
          </p>
        )}
        {stoffe.map((s) => (
          <div key={s.id} className="flex flex-col gap-2 rounded-xl bg-paper-200 p-3">
            <button onClick={() => uebernehmen(s.id)} className="flex items-center justify-between gap-2 text-left">
              <span className="min-w-0 flex-1 truncate text-[15px] text-stone-900">{s.name}</span>
              <span className="shrink-0 text-[12px] text-stone-500">{s.eigenerMesswert ? 'eigener Messwert' : s.quelle}</span>
            </button>
            {temperaturFuer === s.id && (
              <div className="flex items-center gap-2">
                <input
                  value={temperaturC}
                  onChange={(e) => setTemperaturC(e.target.value)}
                  inputMode="decimal"
                  placeholder="Temperatur °C"
                  className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[15px]"
                />
                <button
                  onClick={() => temperaturUebernehmen(s.id)}
                  className="shrink-0 rounded-lg bg-accent-600 px-3 py-2 text-[13px] font-medium text-ink"
                >
                  Übernehmen
                </button>
              </div>
            )}
          </div>
        ))}
        {hinweis && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-[13px] text-amber-900">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            {hinweis}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
