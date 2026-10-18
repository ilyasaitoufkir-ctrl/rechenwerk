import type { Formula } from '../types/formula'
import { BottomSheet } from './BottomSheet'

interface Props {
  offen: boolean
  onClose: () => void
  formel: Formula
  gesucht: string
  onSelect: (variableId: string) => void
}

/** Bottom Sheet zur Wahl der gesuchten Größe - jede Variable der Formel, nicht nur die zielgroessen. */
export function GesuchtAuswahlSheet({ offen, onClose, formel, gesucht, onSelect }: Props) {
  return (
    <BottomSheet offen={offen} onClose={onClose} titel="Gesucht">
      <div className="flex flex-col gap-1 px-4 pb-6 pt-2">
        {formel.variablen.map((v) => (
          <button
            key={v.id}
            onClick={() => {
              onSelect(v.id)
              onClose()
            }}
            className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-left ${
              v.id === gesucht ? 'bg-accent-600 text-ink' : 'bg-paper-200 text-stone-900'
            }`}
          >
            <span>{v.name}</span>
            {!formel.zielgroessen.includes(v.id) && !formel.zusatzAusgaben?.includes(v.id) && (
              <span className={`text-[11px] ${v.id === gesucht ? 'text-ink/70' : 'text-stone-500'}`}>numerisch</span>
            )}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
