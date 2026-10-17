import { BadgeCheck, ChevronRight, Gauge, Star } from 'lucide-react'
import type { Formula } from '../types/formula'
import { navigiere } from '../lib/router'

interface Props {
  formel: Formula
  istFavorit?: boolean
  istVerifiziert?: boolean
  onFavoritToggeln?: () => void
}

export function FormulaCard({ formel, istFavorit, istVerifiziert, onFavoritToggeln }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-paper-200 px-3.5 py-3">
      <button
        onClick={() => navigiere({ name: 'formel', id: formel.id })}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-medium text-stone-900">{formel.name}</p>
          <p className="truncate text-[13px] text-stone-500">{formel.kategorie}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {formel.richtwert && <Gauge size={16} className="text-amber-600" />}
          {istVerifiziert && <BadgeCheck size={16} className="text-sage-600" />}
          <ChevronRight size={18} className="text-stone-400" />
        </div>
      </button>
      {onFavoritToggeln && (
        <button onClick={onFavoritToggeln} aria-label="Favorit umschalten" className="shrink-0 rounded-lg p-2 text-stone-400">
          <Star size={18} className={istFavorit ? 'fill-amber-500 text-amber-500' : ''} />
        </button>
      )}
    </div>
  )
}
