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
    <div className="flex items-center gap-2 rounded-xl border border-paper-300 bg-white px-3 py-3 transition-colors hover:border-accent-300 dark:border-white/10 dark:bg-white/5">
      <button
        onClick={() => navigiere({ name: 'formel', id: formel.id })}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-stone-900 dark:text-stone-100">{formel.name}</p>
          <p className="truncate text-xs text-stone-500 dark:text-stone-400">{formel.kategorie}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {formel.richtwert && (
            <Gauge size={16} className="text-amber-600 dark:text-amber-400" />
          )}
          {istVerifiziert && <BadgeCheck size={16} className="text-sage-600 dark:text-sage-400" />}
          <ChevronRight size={18} className="text-stone-400" />
        </div>
      </button>
      {onFavoritToggeln && (
        <button
          onClick={onFavoritToggeln}
          aria-label="Favorit umschalten"
          className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-paper-100 dark:hover:bg-white/10"
        >
          <Star
            size={18}
            className={istFavorit ? 'fill-amber-400 text-amber-500' : ''}
          />
        </button>
      )}
    </div>
  )
}
