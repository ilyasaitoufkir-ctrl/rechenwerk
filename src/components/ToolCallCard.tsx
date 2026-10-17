import { useState } from 'react'
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  Search,
  FileText,
  Calculator,
  Ruler,
  Database,
  ArrowRight,
  Info,
} from 'lucide-react'
import type { RechnerLink } from '../lib/ki-werkzeuge'
import { setLetzteEingaben } from '../lib/storage'
import { navigiere } from '../lib/router'
import { formatNumber } from '../lib/format'

const WERKZEUG_LABEL: Record<string, string> = {
  formeln_suchen: 'Formelbibliothek durchsucht',
  formel_details: 'Formeldetails abgerufen',
  formel_berechnen: 'Formel berechnet',
  einheit_umrechnen: 'Einheit umgerechnet',
  stoffdaten_abfragen: 'Datentabelle abgefragt',
}

const WERKZEUG_ICON: Record<string, typeof Search> = {
  formeln_suchen: Search,
  formel_details: FileText,
  formel_berechnen: Calculator,
  einheit_umrechnen: Ruler,
  stoffdaten_abfragen: Database,
}

interface FormelBerechnenErgebnis {
  formel: string
  ergebnisse: { id: string; name: string; wertInStandardeinheit: number; standardEinheit: string }[]
  verifiziert?: boolean
  richtwert?: boolean
  quelle?: { werk: string; unsicher?: boolean }
  pflichthinweis?: string
}

function zusammenfassung(name: string, ergebnis: unknown, istFehler: boolean): string | undefined {
  if (istFehler) return (ergebnis as { fehler?: string })?.fehler
  if (name === 'formel_berechnen') {
    const r = ergebnis as FormelBerechnenErgebnis
    const haupt = r.ergebnisse?.[0]
    if (!haupt) return undefined
    return `${haupt.name} = ${formatNumber(haupt.wertInStandardeinheit, 4)} ${haupt.standardEinheit}`
  }
  if (name === 'einheit_umrechnen') {
    const r = ergebnis as { ergebnis?: number }
    return typeof r.ergebnis === 'number' ? `= ${formatNumber(r.ergebnis, 6)}` : undefined
  }
  return undefined
}

export function ToolCallCard({
  name,
  input,
  ergebnis,
  istFehler,
  rechnerLink,
}: {
  name: string
  input: Record<string, unknown>
  ergebnis: unknown
  istFehler: boolean
  rechnerLink?: RechnerLink
}) {
  const [offen, setOffen] = useState(false)
  const Icon = WERKZEUG_ICON[name] ?? Search
  const label = WERKZEUG_LABEL[name] ?? name
  const kurz = zusammenfassung(name, ergebnis, istFehler)
  const formelErgebnis = name === 'formel_berechnen' && !istFehler ? (ergebnis as FormelBerechnenErgebnis) : undefined

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-paper-300 bg-paper-50 text-sm">
      <button onClick={() => setOffen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
        <Icon size={16} className="shrink-0 text-accent-600" />
        <span className="min-w-0 flex-1 truncate font-medium text-stone-700">{label}</span>
        {istFehler ? (
          <XCircle size={16} className="shrink-0 text-red-500" />
        ) : (
          <CheckCircle2 size={16} className="shrink-0 text-sage-600" />
        )}
        <ChevronDown size={16} className={`shrink-0 text-stone-400 transition-transform ${offen ? 'rotate-180' : ''}`} />
      </button>

      {kurz && !offen && <p className="px-3 pb-2 -mt-1.5 truncate text-xs text-stone-500">{kurz}</p>}

      {offen && (
        <div className="flex flex-col gap-2 border-t border-paper-200 px-3 py-2.5">
          <div>
            <p className="mb-0.5 text-xs font-semibold text-stone-500">Eingabe</p>
            <pre className="overflow-x-auto rounded-lg bg-white p-2 text-xs text-stone-600">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          <div>
            <p className="mb-0.5 text-xs font-semibold text-stone-500">Ergebnis</p>
            <pre className="overflow-x-auto rounded-lg bg-white p-2 text-xs text-stone-600">
              {JSON.stringify(ergebnis, null, 2)}
            </pre>
          </div>

          {formelErgebnis && (
            <div className="flex flex-wrap items-center gap-2">
              {formelErgebnis.richtwert && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Richtwert
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  formelErgebnis.verifiziert
                    ? 'bg-sage-100 text-sage-800'
                    : 'bg-paper-200 text-stone-600'
                }`}
              >
                {formelErgebnis.verifiziert ? 'Verifiziert' : 'Unverifiziert'}
              </span>
              {formelErgebnis.quelle?.unsicher && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  <Info size={12} />
                  Quelle unsicher
                </span>
              )}
            </div>
          )}

          {formelErgebnis?.pflichthinweis && (
            <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
              {formelErgebnis.pflichthinweis}
            </p>
          )}

          {rechnerLink && (
            <button
              onClick={() => {
                setLetzteEingaben(rechnerLink.formelId, {
                  ziel: rechnerLink.ziel,
                  werte: rechnerLink.werte,
                  einheiten: rechnerLink.einheiten,
                })
                navigiere({ name: 'formel', id: rechnerLink.formelId })
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-accent-600 px-3 py-2 text-xs font-medium text-white hover:bg-accent-700"
            >
              Im Rechner öffnen
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
