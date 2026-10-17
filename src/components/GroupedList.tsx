import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

/** iOS-artige gruppierte Liste: weiße Gruppe auf grauem Grund, Haarlinien zwischen Zeilen. */
export function GroupedList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col overflow-hidden rounded-2xl bg-paper-200">{children}</div>
}

export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">{children}</p>
  )
}

interface RowProps {
  label: ReactNode
  value?: ReactNode
  icon?: ReactNode
  onClick?: () => void
  chevron?: boolean
  destructive?: boolean
  rechts?: ReactNode
}

export function GroupedRow({ label, value, icon, onClick, chevron = Boolean(onClick), destructive, rechts }: RowProps) {
  const inhalt = (
    <>
      {icon && <span className="shrink-0 text-stone-500">{icon}</span>}
      <span className={`min-w-0 flex-1 truncate text-[17px] ${destructive ? 'text-red-600' : 'text-stone-900'}`}>
        {label}
      </span>
      {value && <span className="shrink-0 truncate text-[17px] tabular-nums text-stone-500">{value}</span>}
      {rechts}
      {chevron && <ChevronRight size={18} className="shrink-0 text-stone-400" />}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex min-h-[44px] w-full items-center gap-3 border-b border-paper-300 px-4 py-2.5 text-left last:border-b-0"
      >
        {inhalt}
      </button>
    )
  }
  return (
    <div className="flex min-h-[44px] w-full items-center gap-3 border-b border-paper-300 px-4 py-2.5 last:border-b-0">
      {inhalt}
    </div>
  )
}
