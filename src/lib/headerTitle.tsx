import { useMemo, useState, type ReactNode } from 'react'
import { HeaderTitleContext, type HeaderTitleContextValue } from './headerTitleContext'

export function HeaderTitleProvider({ children }: { children: ReactNode }) {
  const [titel, setTitel] = useState('Rechenwerk')
  const value = useMemo<HeaderTitleContextValue>(() => ({ titel, setTitel }), [titel])
  return <HeaderTitleContext.Provider value={value}>{children}</HeaderTitleContext.Provider>
}
