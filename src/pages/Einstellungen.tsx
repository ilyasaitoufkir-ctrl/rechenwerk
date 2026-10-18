import { useState } from 'react'
import { History, Minus, Plus, Database, FlaskConical, AlertTriangle } from 'lucide-react'
import { GroupedList, GroupedRow, GroupLabel } from '../components/GroupedList'
import { useEinstellungen } from '../hooks/useEinstellungen'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { navigiere } from '../lib/router'
import { parseDecimal } from '../lib/format'
import {
  getKiZugangscode,
  setKiZugangscode,
  getKiNutzung,
  getLetztesBackup,
} from '../lib/storage'

const MS_PRO_TAG = 86_400_000

function backupIstAbgelaufen(letztesBackup: number | null): boolean {
  if (letztesBackup === null) return true
  return Date.now() - letztesBackup > 30 * MS_PRO_TAG
}

const PREIS_PRO_MTOK = { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }

function geschaetzteKostenEuro(n: ReturnType<typeof getKiNutzung>): number {
  return (
    (n.inputTokens / 1e6) * PREIS_PRO_MTOK.input +
    (n.outputTokens / 1e6) * PREIS_PRO_MTOK.output +
    (n.cacheReadTokens / 1e6) * PREIS_PRO_MTOK.cacheRead +
    (n.cacheWriteTokens / 1e6) * PREIS_PRO_MTOK.cacheWrite
  )
}

export function Einstellungen() {
  useSetHeaderTitle('Einstellungen')
  const { signifikanteStellen, stellenAendern, ambientDruckPa, ambientAendern } = useEinstellungen()
  const [zugangscode, setZugangscodeState] = useState(getKiZugangscode)
  const [codeEingabe, setCodeEingabe] = useState('')
  const [ambientText, setAmbientText] = useState(String(ambientDruckPa))
  const nutzung = getKiNutzung()
  const letztesBackup = getLetztesBackup()

  return (
    <div className="flex flex-col gap-6">
      {backupIstAbgelaufen(letztesBackup) && (
        <button
          onClick={() => navigiere({ name: 'backup' })}
          className="flex items-center gap-2 rounded-2xl bg-amber-100 p-3 text-left text-[13px] text-amber-800"
        >
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            {letztesBackup ? 'Dein letztes Backup ist mehr als 30 Tage alt.' : 'Du hast noch kein Backup erstellt.'}{' '}
            Jetzt sichern?
          </span>
        </button>
      )}

      <section className="flex flex-col gap-1.5">
        <GroupLabel>Daten</GroupLabel>
        <GroupedList>
          <GroupedRow label="Berechnungsverlauf" icon={<History size={18} />} onClick={() => navigiere({ name: 'verlauf' })} />
          <GroupedRow label="Eigene Stoffdaten" icon={<FlaskConical size={18} />} onClick={() => navigiere({ name: 'eigene-stoffe' })} />
          <GroupedRow label="Backup" icon={<Database size={18} />} onClick={() => navigiere({ name: 'backup' })} />
        </GroupedList>
      </section>

      <section className="flex flex-col gap-1.5">
        <GroupLabel>Anzeige</GroupLabel>
        <GroupedList>
          <GroupedRow
            label="Signifikante Stellen"
            rechts={
              <div className="flex items-center gap-3">
                <button
                  onClick={() => stellenAendern(Math.max(2, signifikanteStellen - 1))}
                  aria-label="Weniger Stellen"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-200 text-stone-700"
                >
                  <Minus size={15} />
                </button>
                <span className="w-4 text-center tabular-nums text-stone-900">{signifikanteStellen}</span>
                <button
                  onClick={() => stellenAendern(Math.min(8, signifikanteStellen + 1))}
                  aria-label="Mehr Stellen"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-200 text-stone-700"
                >
                  <Plus size={15} />
                </button>
              </div>
            }
            chevron={false}
          />
          <GroupedRow
            label="Umgebungsdruck (Pa)"
            rechts={
              <input
                type="text"
                inputMode="decimal"
                value={ambientText}
                onChange={(e) => {
                  setAmbientText(e.target.value)
                  const v = parseDecimal(e.target.value)
                  if (v !== null) ambientAendern(v)
                }}
                className="w-24 rounded-lg border border-paper-300 bg-paper-50 px-2 py-1 text-right text-[15px] tabular-nums"
              />
            }
            chevron={false}
          />
        </GroupedList>
      </section>

      <section className="flex flex-col gap-1.5">
        <GroupLabel>KI-Assistent</GroupLabel>
        <GroupedList>
          <div className="flex flex-col gap-2 border-b border-paper-300 px-4 py-3">
            <span className="text-[17px] text-stone-900">Zugangscode</span>
            <div className="flex gap-2">
              <input
                value={codeEingabe}
                onChange={(e) => setCodeEingabe(e.target.value)}
                placeholder={zugangscode ? '•••• bereits gespeichert' : 'Zugangscode eingeben'}
                className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-50 px-3 py-1.5 text-[15px]"
              />
              <button
                onClick={() => {
                  setKiZugangscode(codeEingabe)
                  setZugangscodeState(getKiZugangscode())
                  setCodeEingabe('')
                }}
                className="shrink-0 rounded-lg bg-accent-600 px-3 py-1.5 text-[13px] font-medium text-ink"
              >
                Speichern
              </button>
            </div>
            <p className="text-[12px] text-stone-500">
              Persönlicher Zugangscode für den Assistenten - nicht der API-Schlüssel. Der bleibt
              ausschließlich serverseitig in Vercel hinterlegt.
            </p>
          </div>
          <div className="flex flex-col gap-0.5 px-4 py-3">
            <span className="text-[13px] font-semibold text-stone-500">Geschätzte Kosten (lokal, ungefähr)</span>
            <span className="text-[15px] text-stone-900">
              {nutzung.anfragen} Anfragen · ca. {geschaetzteKostenEuro(nutzung).toFixed(3)} €
            </span>
            <span className="text-[12px] text-stone-500">
              Grobe Schätzung anhand der Token-Nutzung zu aktuellen Listenpreisen, keine echte Abrechnung.
            </span>
          </div>
        </GroupedList>
      </section>

      <section className="flex flex-col gap-1.5">
        <GroupLabel>Über Rechenwerk</GroupLabel>
        <GroupedList>
          <GroupedRow label="Version" value="Phase 5" chevron={false} />
        </GroupedList>
        <p className="px-1 text-[13px] text-stone-500">
          Lieber eine Formel weniger als eine falsche oder ungeprüfte.
        </p>
      </section>
    </div>
  )
}
