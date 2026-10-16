import { ShieldAlert } from 'lucide-react'

/**
 * Nicht wegklickbarer Hinweis für alle Druckgeräte-Rechner. Siehe auch den
 * identischen Hinweis im Rechenweg jeder einzelnen Druckgeräte-Formel
 * (DRUCKGERAETE_HINWEIS in src/formulas/druckgeraete/hinweis.ts).
 */
export function DruckgeraeteBanner() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-200">
      <ShieldAlert size={18} className="mt-0.5 shrink-0" />
      <p>
        Vorauslegung und Plausibilitätsprüfung. Ersetzt keine normgerechte Berechnung und keine
        Prüfung durch eine zugelassene Stelle.
      </p>
    </div>
  )
}
