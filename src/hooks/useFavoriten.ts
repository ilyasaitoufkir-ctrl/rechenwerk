import { useCallback, useState } from 'react'
import { favoritToggeln, getFavoriten } from '../lib/storage'

export function useFavoriten() {
  const [favoriten, setFavoriten] = useState<string[]>(getFavoriten)

  const toggeln = useCallback((id: string) => {
    setFavoriten(favoritToggeln(id))
  }, [])

  const istFavorit = useCallback((id: string) => favoriten.includes(id), [favoriten])

  return { favoriten, toggeln, istFavorit }
}
