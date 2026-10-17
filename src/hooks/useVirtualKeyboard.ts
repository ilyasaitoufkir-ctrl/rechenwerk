import { useEffect, useState } from 'react'

/**
 * Erkennt über die visualViewport-API, ob die virtuelle Tastatur auf dem
 * iPhone geöffnet ist (Layout-Viewport bleibt bei iOS gleich groß, der
 * visuelle Viewport schrumpft) - damit kann die Tableiste ausgeblendet und
 * das fokussierte Feld sichtbar gehalten werden.
 */
export function useVirtualKeyboard(): { tastaturOffen: boolean; tastaturHoehe: number } {
  const [zustand, setZustand] = useState({ tastaturOffen: false, tastaturHoehe: 0 })

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    function aktualisieren() {
      if (!vv) return
      const hoehe = window.innerHeight - vv.height - vv.offsetTop
      setZustand({ tastaturOffen: hoehe > 80, tastaturHoehe: Math.max(0, hoehe) })
    }

    aktualisieren()
    vv.addEventListener('resize', aktualisieren)
    vv.addEventListener('scroll', aktualisieren)
    return () => {
      vv.removeEventListener('resize', aktualisieren)
      vv.removeEventListener('scroll', aktualisieren)
    }
  }, [])

  return zustand
}
