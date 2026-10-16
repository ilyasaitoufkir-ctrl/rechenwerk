import { useState } from 'react'
import { BadgeCheck, CircleDashed, Gauge } from 'lucide-react'
import type { Verifizierung } from '../lib/storage'

interface Props {
  verifizierung: Verifizierung | undefined
  richtwert?: boolean
  onSetzen: (verifiziert: boolean, notiz?: string) => void
}

export function VerificationBadge({ verifizierung, richtwert, onSetzen }: Props) {
  const [notizOffen, setNotizOffen] = useState(false)
  const [notiz, setNotiz] = useState(verifizierung?.notiz ?? '')
  const verifiziert = verifizierung?.verifiziert ?? false

  return (
    <div className="flex flex-wrap items-center gap-2">
      {richtwert && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          <Gauge size={14} />
          Richtwert, Orientierung
        </span>
      )}

      {verifiziert ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-800 dark:bg-sage-900/30 dark:text-sage-300">
          <BadgeCheck size={14} />
          Verifiziert am {new Date(verifizierung!.datum).toLocaleDateString('de-DE')}
          {verifizierung?.notiz ? ` · ${verifizierung.notiz}` : ''}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 dark:bg-white/10 dark:text-stone-300">
          <CircleDashed size={14} />
          Unverifiziert
        </span>
      )}

      {!notizOffen && (
        <button
          onClick={() => (verifiziert ? onSetzen(false) : setNotizOffen(true))}
          className="text-xs font-medium text-accent-700 underline-offset-2 hover:underline dark:text-accent-300"
        >
          {verifiziert ? 'Als unverifiziert markieren' : 'Als verifiziert markieren'}
        </button>
      )}

      {notizOffen && (
        <div className="flex w-full flex-wrap items-center gap-2">
          <input
            autoFocus
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            placeholder="Notiz, z. B. geprüft mit Sigloch, Gl. 6.12"
            className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-white px-3 py-1.5 text-xs dark:border-white/15 dark:bg-white/5"
          />
          <button
            onClick={() => {
              onSetzen(true, notiz.trim() || undefined)
              setNotizOffen(false)
            }}
            className="rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-700"
          >
            Speichern
          </button>
        </div>
      )}
    </div>
  )
}
