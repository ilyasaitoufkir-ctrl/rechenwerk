/**
 * Zusätzliche Absicherung gegen Pinch-/Doppeltipp-Zoom auf iOS Safari, da
 * manche iOS-Versionen `user-scalable=no` im Viewport-Meta nicht zuverlässig
 * respektieren. touch-action: manipulation (siehe index.css) deckt die
 * meisten Fälle ab, gesturestart/-change sind die verbleibende Lücke.
 */
export function nativeVerhaltenAktivieren(): void {
  const verhindern = (e: Event) => e.preventDefault()
  document.addEventListener('gesturestart', verhindern, { passive: false })
  document.addEventListener('gesturechange', verhindern, { passive: false })

  let letzterTouchEnde = 0
  document.addEventListener(
    'touchend',
    (e) => {
      const jetzt = Date.now()
      if (jetzt - letzterTouchEnde <= 300) e.preventDefault()
      letzterTouchEnde = jetzt
    },
    { passive: false },
  )
}
