import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'bibliothek' }
  | { name: 'verlauf' }
  | { name: 'einheiten' }
  | { name: 'pruefliste' }
  | { name: 'kauf-miete' }
  | { name: 'formel'; id: string }

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  const [segment, id] = path.split('/')
  if (segment === 'formel' && id) return { name: 'formel', id: decodeURIComponent(id) }
  if (segment === 'bibliothek') return { name: 'bibliothek' }
  if (segment === 'verlauf') return { name: 'verlauf' }
  if (segment === 'einheiten') return { name: 'einheiten' }
  if (segment === 'pruefliste') return { name: 'pruefliste' }
  if (segment === 'kauf-miete') return { name: 'kauf-miete' }
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
