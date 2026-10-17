import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface Props {
  latex: string
  display?: boolean
}

// KaTeX ist mit Abstand der größte Teil des Bundles und wird nur gebraucht,
// sobald tatsächlich eine Formel angezeigt wird - deshalb per dynamic import
// nachgeladen statt im Startbundle enthalten zu sein.
let katexPromise: Promise<typeof import('katex')> | null = null
function ladeKatex() {
  if (!katexPromise) {
    katexPromise = Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(
      ([mod]) => mod,
    )
  }
  return katexPromise
}

export function KatexBlock({ latex, display = true }: Props) {
  const [html, setHtml] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let aktiv = true
    ladeKatex().then((katex) => {
      if (!aktiv) return
      try {
        setHtml(katex.default.renderToString(latex, { displayMode: display, throwOnError: false }))
      } catch {
        setHtml(latex)
      }
    })
    return () => {
      aktiv = false
    }
  }, [latex, display])

  // Lange Formeln werden zuerst verkleinert, bis sie in die Breite passen -
  // erst wenn das Verkleinern nicht mehr reicht, scrollt der eigene Kasten.
  useLayoutEffect(() => {
    const container = containerRef.current
    const inner = innerRef.current
    if (!html || !container || !inner) return
    inner.style.transform = 'none'
    const containerWidth = container.clientWidth
    const naturalWidth = inner.scrollWidth
    if (containerWidth > 0 && naturalWidth > containerWidth) {
      const skala = Math.max(0.55, containerWidth / naturalWidth)
      inner.style.transform = `scale(${skala})`
      inner.style.transformOrigin = 'left center'
    }
  }, [html])

  if (html === null) {
    return <div className="h-8 max-w-full animate-pulse rounded bg-paper-200" />
  }

  return (
    <div ref={containerRef} className="katex-scroll max-w-full">
      <div ref={innerRef} className="inline-block" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
