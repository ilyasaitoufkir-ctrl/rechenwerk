import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  text: string
  aktion?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, text, aktion }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Icon size={28} className="text-stone-400" strokeWidth={1.5} />
      <p className="max-w-xs text-[15px] text-stone-500">{text}</p>
      {aktion && (
        <button onClick={aktion.onClick} className="text-[15px] font-medium text-accent-600">
          {aktion.label}
        </button>
      )}
    </div>
  )
}
