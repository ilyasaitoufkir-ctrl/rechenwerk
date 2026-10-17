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
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[12px] font-medium text-amber-800">
          <Gauge size={13} />
          Richtwert, Orientierung
        </span>
      )}

      {verifiziert ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-3 py-1 text-[12px] font-medium text-sage-800">
          <BadgeCheck size={13} />
          Verifiziert am {new Date(verifizierung!.datum).toLocaleDateString('de-DE')}
          {verifizierung?.notiz ? ` · ${verifizierung.notiz}` : ''}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-paper-200 px-3 py-1 text-[12px] font-medium text-stone-600">
          <CircleDashed size={13} />
          Unverifiziert
        </span>
      )}

      {!notizOffen && (
        <button
          onClick={() => (verifiziert ? onSetzen(false) : setNotizOffen(true))}
          className="text-[12px] font-medium text-accent-600"
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
            className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-white px-3 py-1.5 text-[13px]"
          />
          <button
            onClick={() => {
              onSetzen(true, notiz.trim() || undefined)
              setNotizOffen(false)
            }}
            className="rounded-lg bg-accent-600 px-3 py-1.5 text-[12px] font-medium text-white"
          >
            Speichern
          </button>
        </div>
      )}
    </div>
  )
}
