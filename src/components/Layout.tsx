import { useRef, useState, type ReactNode } from 'react'
import { Home, Calculator, Bot, Library, Settings, ChevronLeft } from 'lucide-react'
import { navigiere, useRoute, zurueck, TAB_ROUTEN, type Route } from '../lib/router'
import { useHeaderTitle } from '../lib/headerTitleContext'
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard'

interface Props {
  children: ReactNode
}

const TAB_ITEMS: { route: Route; label: string; icon: typeof Home }[] = [
  { route: { name: 'home' }, label: 'Start', icon: Home },
  { route: { name: 'rechner' }, label: 'Rechner', icon: Calculator },
  { route: { name: 'assistent' }, label: 'Assistent', icon: Bot },
  { route: { name: 'bibliothek' }, label: 'Bibliothek', icon: Library },
  { route: { name: 'einstellungen' }, label: 'Einstellungen', icon: Settings },
]

export function Layout({ children }: Props) {
  const route = useRoute()
  const titel = useHeaderTitle()
  const { tastaturOffen } = useVirtualKeyboard()
  const [kompakt, setKompakt] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const istTab = (TAB_ROUTEN as readonly string[]).includes(route.name)
  // Der Assistent braucht eine eigene, volle Scrollfläche mit fest stehender
  // Eingabezeile (Chat-UI) statt der normalen gepolsterten Titel+Inhalt-Spalte.
  const istVollflaeche = route.name === 'assistent'

  function aufScroll() {
    const top = scrollRef.current?.scrollTop ?? 0
    setKompakt(top > 24)
  }

  return (
    <div className="flex h-dvh flex-col bg-paper-50">
      <header
        className="shrink-0 border-b bg-paper-50/90 backdrop-blur transition-colors"
        style={{
          paddingTop: 'var(--safe-top)',
          borderColor: istTab && !kompakt ? 'transparent' : 'var(--color-paper-300)',
        }}
      >
        <div className="relative flex h-11 items-center justify-center px-2">
          {!istTab && (
            <button
              onClick={zurueck}
              className="absolute left-1 flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-[17px] text-accent-600"
            >
              <ChevronLeft size={22} />
              <span className="text-[15px]">Zurück</span>
            </button>
          )}
          <p
            className="truncate px-16 text-[15px] font-semibold text-stone-900 transition-opacity"
            style={{ opacity: istTab && !istVollflaeche ? (kompakt ? 1 : 0) : 1 }}
          >
            {titel}
          </p>
        </div>
      </header>

      {istVollflaeche ? (
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      ) : (
        <main
          ref={scrollRef}
          onScroll={istTab ? aufScroll : undefined}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        >
          <div key={route.name + ('id' in route ? route.id : '')} className={istTab ? '' : 'page-enter'}>
            {istTab && (
              <h1 className="px-4 pb-1 pt-1 text-[32px] font-bold tracking-tight text-stone-900">{titel}</h1>
            )}
            <div className="px-4 pb-10 pt-2">{children}</div>
          </div>
        </main>
      )}

      <nav
        className="shrink-0 border-t border-paper-300 bg-paper-50/90 backdrop-blur transition-transform duration-200"
        style={{
          paddingBottom: 'var(--safe-bottom)',
          transform: tastaturOffen ? 'translateY(100%)' : 'translateY(0)',
        }}
      >
        <div className="flex">
          {TAB_ITEMS.map(({ route: r, label, icon: Icon }) => {
            const aktiv = r.name === route.name
            return (
              <button
                key={label}
                onClick={() => navigiere(r)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  aktiv ? 'text-accent-600' : 'text-stone-500'
                }`}
              >
                <Icon size={22} strokeWidth={aktiv ? 2.2 : 1.8} />
                {label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
