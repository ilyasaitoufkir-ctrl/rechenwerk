import { useCallback, useState } from 'react'
import { getVerifizierungen, verifizierungSetzen, type Verifizierung } from '../lib/storage'

export function useVerifizierung() {
  const [verifizierungen, setVerifizierungen] = useState<Record<string, Verifizierung>>(
    getVerifizierungen,
  )

  const setzen = useCallback((formelId: string, verifiziert: boolean, notiz?: string) => {
    verifizierungSetzen(formelId, verifiziert, notiz)
    setVerifizierungen(getVerifizierungen())
  }, [])

  return { verifizierungen, setzen }
}
