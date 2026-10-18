import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'rechner' }
  | { name: 'bibliothek' }
  | { name: 'einstellungen' }
  | { name: 'verlauf' }
  | { name: 'einheiten' }
  | { name: 'kauf-miete' }
  | { name: 'pumpen-betriebspunkt' }
  | { name: 'rezeptur-skalieren' }
  | { name: 'statistik' }
  | { name: 'regression' }
  | { name: 'fehlerfortpflanzung' }
  | { name: 'mccabe-thiele' }
  | { name: 'assistent' }
  | { name: 'rechner-kategorie'; kategorie: string }
  | { name: 'formel'; id: string }
  | { name: 'backup' }
  | { name: 'projekte' }
  | { name: 'projekt'; id: string }
  | { name: 'eigene-stoffe' }
  | { name: 'scan' }

/** Tab-Wurzeln: großer Titel, keine Zurück-Navigation. */
export const TAB_ROUTEN = ['home', 'rechner', 'assistent', 'bibliothek', 'einstellungen'] as const

const EINFACHE_ROUTEN = [
  'rechner',
  'bibliothek',
  'einstellungen',
  'verlauf',
  'einheiten',
  'kauf-miete',
  'pumpen-betriebspunkt',
  'rezeptur-skalieren',
  'statistik',
  'regression',
  'fehlerfortpflanzung',
  'mccabe-thiele',
  'assistent',
  'backup',
  'projekte',
  'eigene-stoffe',
  'scan',
] as const

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  const [segment, id] = path.split('/')
  if (segment === 'formel' && id) return { name: 'formel', id: decodeURIComponent(id) }
  if (segment === 'rechner-kategorie' && id) return { name: 'rechner-kategorie', kategorie: decodeURIComponent(id) }
  if (segment === 'projekt' && id) return { name: 'projekt', id: decodeURIComponent(id) }
  const einfach = EINFACHE_ROUTEN.find((r) => r === segment)
  if (einfach) return { name: einfach }
  return { name: 'home' }
}

export function navigiere(route: Route): void {
  const hash =
    route.name === 'home'
      ? '#/'
      : route.name === 'formel'
        ? `#/formel/${encodeURIComponent(route.id)}`
        : route.name === 'rechner-kategorie'
          ? `#/rechner-kategorie/${encodeURIComponent(route.kategorie)}`
          : route.name === 'projekt'
            ? `#/projekt/${encodeURIComponent(route.id)}`
            : `#/${route.name}`
  window.location.hash = hash
}

/** Für Unterseiten: eine Ebene zurück (Browser-Verlauf, da jede Hash-Änderung einen Eintrag erzeugt). */
export function zurueck(): void {
  window.history.back()
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
