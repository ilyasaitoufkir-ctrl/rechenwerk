import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  latex: string
  display?: boolean
}

export function KatexBlock({ latex, display = true }: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, { displayMode: display, throwOnError: false })
    } catch {
      return latex
    }
  }, [latex, display])

  return (
    <div className="katex-scroll max-w-full" dangerouslySetInnerHTML={{ __html: html }} />
  )
}
