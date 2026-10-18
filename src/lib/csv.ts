/**
 * Minimaler, selbst geschriebener CSV-Export (deutsches Format: Semikolon als Trenner, Komma als
 * Dezimaltrenner) - verallgemeinert das bisher nur lokal in Statistik.tsx vorhandene Muster für
 * Parameterstudien, den Rohrleitungs-Baukasten und das Bilanz-Fließbild.
 */
function csvFeld(f: string | number): string {
  if (typeof f === 'number') return Number.isFinite(f) ? String(f).replace('.', ',') : ''
  if (f.includes(';') || f.includes('"') || f.includes('\n')) return `"${f.replace(/"/g, '""')}"`
  return f
}

export function csvAusZeilen(header: string[], zeilen: (string | number)[][]): string {
  return [header, ...zeilen].map((zeile) => zeile.map(csvFeld).join(';')).join('\n')
}

export function csvHerunterladen(dateiname: string, inhalt: string): void {
  const blob = new Blob([inhalt], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = dateiname
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
