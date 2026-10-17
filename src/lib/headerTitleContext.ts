import { createContext, useContext, useEffect } from 'react'

export interface HeaderTitleContextValue {
  titel: string
  setTitel: (t: string) => void
}

export const HeaderTitleContext = createContext<HeaderTitleContextValue | null>(null)

/** Jede Seite meldet hiermit ihren Titel für die Kopfzeile an - ersetzt eigene <h1>-Elemente. */
export function useSetHeaderTitle(titel: string): void {
  const ctx = useContext(HeaderTitleContext)
  if (!ctx) throw new Error('useSetHeaderTitle muss innerhalb von HeaderTitleProvider verwendet werden')
  useEffect(() => {
    ctx.setTitel(titel)
    // Nur beim Mount/Titelwechsel setzen - setTitel selbst ist stabil (useState-Setter).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titel])
}

export function useHeaderTitle(): string {
  const ctx = useContext(HeaderTitleContext)
  if (!ctx) throw new Error('useHeaderTitle muss innerhalb von HeaderTitleProvider verwendet werden')
  return ctx.titel
}
