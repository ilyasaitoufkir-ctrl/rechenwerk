import { Check } from 'lucide-react'
import { BottomSheet } from './BottomSheet'

interface Props {
  offen: boolean
  onClose: () => void
  einheiten: { id: string; label: string }[]
  ausgewaehlt: string
  onSelect: (id: string) => void
  titel?: string
}

export function UnitPickerSheet({ offen, onClose, einheiten, ausgewaehlt, onSelect, titel }: Props) {
  return (
    <BottomSheet offen={offen} onClose={onClose} titel={titel ?? 'Einheit wählen'}>
      <div className="flex flex-col">
        {einheiten.map((u) => (
          <button
            key={u.id}
            onClick={() => {
              onSelect(u.id)
              onClose()
            }}
            className="flex min-h-[44px] items-center justify-between border-b border-paper-300 px-4 py-3 text-left last:border-b-0"
          >
            <span className={`text-[17px] ${u.id === ausgewaehlt ? 'font-semibold text-accent-600' : 'text-stone-900'}`}>
              {u.label}
            </span>
            {u.id === ausgewaehlt && <Check size={18} className="text-accent-600" />}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
