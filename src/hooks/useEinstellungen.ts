import { useCallback, useState } from 'react'
import {
  getAmbientDruckPa,
  getSignifikanteStellen,
  setAmbientDruckPa,
  setSignifikanteStellen,
} from '../lib/storage'

export function useEinstellungen() {
  const [signifikanteStellen, setStellen] = useState(getSignifikanteStellen)
  const [ambientDruckPa, setAmbient] = useState(getAmbientDruckPa)

  const stellenAendern = useCallback((n: number) => {
    setStellen(n)
    setSignifikanteStellen(n)
  }, [])

  const ambientAendern = useCallback((pa: number) => {
    setAmbient(pa)
    setAmbientDruckPa(pa)
  }, [])

  return { signifikanteStellen, stellenAendern, ambientDruckPa, ambientAendern }
}
