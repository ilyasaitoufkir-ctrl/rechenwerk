import { ChevronDown } from 'lucide-react'

/** Antippbarer Chip, der das Einheiten-Sheet öffnet - ersetzt natives <select>. */
export function UnitChip({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex shrink-0 items-center gap-1 rounded-xl border border-paper-300 bg-paper-50 px-3 py-3 text-[15px] font-medium text-stone-700 disabled:opacity-50"
    >
      {label}
      <ChevronDown size={14} className="text-stone-400" />
    </button>
  )
}
