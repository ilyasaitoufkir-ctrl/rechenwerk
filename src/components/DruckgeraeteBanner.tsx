import { ShieldAlert } from 'lucide-react'

/**
 * Nicht wegklickbarer Hinweis für alle Druckgeräte-Rechner. Siehe auch den
 * identischen Hinweis im Rechenweg jeder einzelnen Druckgeräte-Formel
 * (DRUCKGERAETE_HINWEIS in src/formulas/druckgeraete/hinweis.ts).
 */
export function DruckgeraeteBanner() {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-[13px] text-red-900">
      <ShieldAlert size={17} className="mt-0.5 shrink-0" />
      <p>
        Vorauslegung und Plausibilitätsprüfung. Ersetzt keine normgerechte Berechnung und keine
        Prüfung durch eine zugelassene Stelle.
      </p>
    </div>
  )
}
