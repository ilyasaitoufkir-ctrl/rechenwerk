/**
 * Clientseitige Bildkompression - gemeinsam genutzt von Assistent, Projekten
 * (Fotos) und dem Scan-Ablauf. Verkleinert auf eine maximale Kantenlänge und
 * liefert sowohl die Rohteile (für Anthropic-Bildblöcke) als auch die fertige
 * data:-URL (für Vorschau/IndexedDB-Speicherung).
 */
export interface VerarbeitetesBild {
  mediaType: string
  data: string
  dataUrl: string
}

export async function bildVerarbeiten(file: File, maxKantenlaengePx = 1600, qualitaet = 0.85): Promise<VerarbeitetesBild> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Bild konnte nicht gelesen werden.'))
    reader.readAsDataURL(file)
  })

  const bild = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'))
    img.src = dataUrl
  })

  const skala = Math.min(1, maxKantenlaengePx / Math.max(bild.width, bild.height))
  const breite = Math.round(bild.width * skala)
  const hoehe = Math.round(bild.height * skala)

  const canvas = document.createElement('canvas')
  canvas.width = breite
  canvas.height = hoehe
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Bildverarbeitung nicht verfügbar.')
  ctx.drawImage(bild, 0, 0, breite, hoehe)

  const verkleinert = canvas.toDataURL('image/jpeg', qualitaet)
  const data = verkleinert.slice(verkleinert.indexOf(',') + 1)
  return { mediaType: 'image/jpeg', data, dataUrl: verkleinert }
}
