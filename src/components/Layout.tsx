import type { ReactNode } from 'react'
import { Home, Library, Ruler, History, ListChecks, Bot } from 'lucide-react'
import { navigiere, useRoute, type Route } from '../lib/router'

interface Props {
  children: ReactNode
}

const NAV_ITEMS: { route: Route; label: string; icon: typeof Home }[] = [
  { route: { name: 'home' }, label: 'Start', icon: Home },
  { route: { name: 'bibliothek' }, label: 'Bibliothek', icon: Library },
  { route: { name: 'assistent' }, label: 'Assistent', icon: Bot },
  { route: { name: 'einheiten' }, label: 'Einheiten', icon: Ruler },
  { route: { name: 'verlauf' }, label: 'Verlauf', icon: History },
  { route: { name: 'pruefliste' }, label: 'Prüfen', icon: ListChecks },
]

export function Layout({ children }: Props) {
  const route = useRoute()

  return (
    <div className="min-h-dvh flex flex-col bg-paper-50 text-stone-900 dark:bg-[#17191a] dark:text-stone-100">
      <header className="sticky top-0 z-10 border-b border-paper-300/70 bg-paper-50/90 backdrop-blur dark:border-white/10 dark:bg-[#17191a]/90">
        <div className="mx-auto flex max-w-xl items-center gap-2 px-4 py-3">
          <button
            onClick={() => navigiere({ name: 'home' })}
            className="text-lg font-semibold tracking-tight text-accent-800 dark:text-accent-200"
          >
            Rechenwerk
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-paper-300/70 bg-paper-50/95 backdrop-blur dark:border-white/10 dark:bg-[#17191a]/95">
        <div className="mx-auto flex max-w-xl">
          {NAV_ITEMS.map(({ route: r, label, icon: Icon }) => {
            const aktiv = r.name === route.name
            return (
              <button
                key={label}
                onClick={() => navigiere(r)}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  aktiv
                    ? 'text-accent-700 dark:text-accent-300'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                <Icon size={22} strokeWidth={aktiv ? 2.4 : 1.8} />
                {label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
