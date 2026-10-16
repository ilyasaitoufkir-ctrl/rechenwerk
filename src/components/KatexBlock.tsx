import { useEffect, useState } from 'react'

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

  if (html === null) {
    return <div className="h-8 max-w-full animate-pulse rounded bg-paper-200 dark:bg-white/10" />
  }

  return <div className="katex-scroll max-w-full" dangerouslySetInnerHTML={{ __html: html }} />
}
