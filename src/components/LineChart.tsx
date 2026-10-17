import { formatNumber } from '../lib/format'

export interface ChartPunkt {
  x: number
  y: number
}

export interface ChartReihe {
  label: string
  punkte: ChartPunkt[]
  farbe: string
  typ?: 'linie' | 'punkte'
}

interface Props {
  reihen: ChartReihe[]
  ariaLabel: string
  markierung?: { x: number; y: number; label: string; farbe?: string }
  hoehe?: number
}

/**
 * Minimales, selbst gebautes SVG-Liniendiagramm (keine Diagrammbibliothek).
 * Skaliert per viewBox auf die volle Containerbreite, damit es auch bei
 * 360 px ohne horizontales Scrollen passt.
 */
export function LineChart({ reihen, ariaLabel, markierung, hoehe = 300 }: Props) {
  const width = 600
  const height = hoehe
  const padding = { top: 16, right: 16, bottom: 28, left: 56 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  const allePunkte = reihen.flatMap((r) => r.punkte).concat(markierung ? [markierung] : [])
  if (allePunkte.length === 0) return null

  const xMin = Math.min(0, ...allePunkte.map((p) => p.x))
  const xMax = Math.max(...allePunkte.map((p) => p.x))
  const yMin = Math.min(0, ...allePunkte.map((p) => p.y))
  const yMax = Math.max(...allePunkte.map((p) => p.y))
  const xSpan = xMax - xMin || 1
  const ySpan = yMax - yMin || 1

  function x(v: number) {
    return padding.left + ((v - xMin) / xSpan) * plotW
  }
  function y(v: number) {
    return padding.top + plotH - ((v - yMin) / ySpan) * plotH
  }

  function pfad(punkte: ChartPunkt[]) {
    const sortiert = [...punkte].sort((a, b) => a.x - b.x)
    return sortiert.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.x).toFixed(1)} ${y(p.y).toFixed(1)}`).join(' ')
  }

  const ticks = 4
  const xTicks = Array.from({ length: ticks + 1 }, (_, i) => xMin + (xSpan * i) / ticks)
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yMin + (ySpan * i) / ticks)

  return (
    <div className="rounded-2xl bg-white p-2">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={ariaLabel}>
        {yTicks.map((v, i) => (
          <g key={`y${i}`}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y(v)}
              y2={y(v)}
              className="stroke-paper-200"
              strokeWidth={1}
            />
            <text x={padding.left - 8} y={y(v) + 4} textAnchor="end" fontSize={11} className="fill-stone-500">
              {formatNumber(v, 3)}
            </text>
          </g>
        ))}
        {xTicks.map((v, i) => (
          <text
            key={`x${i}`}
            x={x(v)}
            y={height - padding.bottom + 16}
            textAnchor="middle"
            fontSize={11}
            className="fill-stone-500"
          >
            {formatNumber(v, 3)}
          </text>
        ))}

        {reihen.map((r) =>
          r.typ === 'punkte' ? (
            <g key={r.label}>
              {r.punkte.map((p, i) => (
                <circle key={i} cx={x(p.x)} cy={y(p.y)} r={3.5} fill={r.farbe} />
              ))}
            </g>
          ) : (
            <path key={r.label} d={pfad(r.punkte)} fill="none" stroke={r.farbe} strokeWidth={2.5} />
          ),
        )}

        {markierung && (
          <g>
            <circle cx={x(markierung.x)} cy={y(markierung.y)} r={5.5} fill={markierung.farbe ?? '#b7791f'} stroke="white" strokeWidth={1.5} />
          </g>
        )}
      </svg>
      <div className="flex flex-wrap gap-4 px-2 pb-1 text-xs text-stone-600">
        {reihen.map((r) => (
          <span key={r.label} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: r.farbe }} />
            {r.label}
          </span>
        ))}
        {markierung && (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: markierung.farbe ?? '#b7791f' }}
            />
            {markierung.label}
          </span>
        )}
      </div>
    </div>
  )
}
