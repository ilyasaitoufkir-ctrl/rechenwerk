import { useCallback, useState } from 'react'
import {
  getVerlauf,
  verlaufEintragHinzufuegen,
  verlaufEintragLoeschen,
  verlaufLeeren,
  type VerlaufEintrag,
} from '../lib/storage'

export function useVerlauf() {
  const [verlauf, setVerlauf] = useState<VerlaufEintrag[]>(getVerlauf)

  const hinzufuegen = useCallback((eintrag: Omit<VerlaufEintrag, 'id' | 'zeitpunkt'>) => {
    setVerlauf(verlaufEintragHinzufuegen(eintrag))
  }, [])

  const loeschen = useCallback((id: string) => {
    setVerlauf(verlaufEintragLoeschen(id))
  }, [])

  const leeren = useCallback(() => {
    verlaufLeeren()
    setVerlauf([])
  }, [])

  return { verlauf, hinzufuegen, loeschen, leeren }
}
