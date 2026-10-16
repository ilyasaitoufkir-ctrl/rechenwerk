import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'bibliothek' }
  | { name: 'verlauf' }
  | { name: 'einheiten' }
  | { name: 'pruefliste' }
  | { name: 'kauf-miete' }
  | { name: 'pumpen-betriebspunkt' }
  | { name: 'rezeptur-skalieren' }
  | { name: 'statistik' }
  | { name: 'regression' }
  | { name: 'fehlerfortpflanzung' }
  | { name: 'mccabe-thiele' }
  | { name: 'assistent' }
  | { name: 'formel'; id: string }

const EINFACHE_ROUTEN = [
  'bibliothek',
  'verlauf',
  'einheiten',
  'pruefliste',
  'kauf-miete',
  'pumpen-betriebspunkt',
  'rezeptur-skalieren',
  'statistik',
  'regression',
  'fehlerfortpflanzung',
  'mccabe-thiele',
  'assistent',
] as const

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  const [segment, id] = path.split('/')
  if (segment === 'formel' && id) return { name: 'formel', id: decodeURIComponent(id) }
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
        : `#/${route.name}`
  window.location.hash = hash
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
