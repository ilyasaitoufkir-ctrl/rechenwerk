import { describe, it, expect, beforeEach, vi } from 'vitest'
import { projektAnlegen, projektBerechnungHinzufuegen, getProjekt, getProjekte, type ProjektBerechnung } from './storage'

/**
 * storage.ts kapselt jeden localStorage-Zugriff in try/catch und fällt bei fehlendem Storage
 * (z. B. Node-Testumgebung) auf einen Fallback zurück - dort wäre "nach dem Neuladen" also nie
 * echt geprüft. Ein minimaler In-Memory-Shim macht getItem/setItem real, sodass dieser Test
 * echte Schreib-/Lesevorgänge über die exportierten Funktionen prüft, nicht nur die Fallback-Pfade.
 */
function speicherShim() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      map.set(k, v)
    },
    removeItem: (k: string) => {
      map.delete(k)
    },
    clear: () => map.clear(),
  }
}

describe('Projekt-Persistenz: Berechnungen bleiben nach "Neuladen" (frischer Storage-Read) unverändert', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', speicherShim())
  })

  it('eine gespeicherte Berechnung ist nach einem frischen getProjekt-Aufruf unverändert', () => {
    const projekt = projektAnlegen('Testprojekt', 'Beschreibung')
    const berechnung: Omit<ProjektBerechnung, 'id'> = {
      formelId: 'reynolds',
      formelName: 'Reynoldszahl',
      kategorie: 'Strömung & Rohrleitungen',
      bekannt: { v: 2, d: 0.077, nu: 1e-6 },
      ziel: 'Re',
      ergebnis: { Re: 154000 },
      quelle: { werk: 'Sigloch, Technische Fluidmechanik', kapitel: 'Reynoldszahl' },
      verifiziert: true,
      richtwert: false,
      zeitpunkt: 1700000000000,
    }
    projektBerechnungHinzufuegen(projekt.id, berechnung)

    // "Neuladen" simulieren: ein komplett neuer, unabhängiger Lesevorgang aus demselben Storage-Backing.
    const projektNachReload = getProjekt(projekt.id)
    expect(projektNachReload).toBeDefined()
    expect(projektNachReload!.berechnungen).toHaveLength(1)
    const gespeichert = projektNachReload!.berechnungen[0]
    expect(gespeichert).toMatchObject(berechnung)
    expect(typeof gespeichert.id).toBe('string')

    // ein zweiter unabhängiger Lesevorgang (z. B. von einer anderen Seite) liefert denselben Stand
    const andererLesevorgang = getProjekte().find((p) => p.id === projekt.id)
    expect(andererLesevorgang!.berechnungen[0]).toEqual(gespeichert)
  })

  it('mehrere Berechnungen bleiben vollständig und in Einfügereihenfolge (neueste zuerst) erhalten', () => {
    const projekt = projektAnlegen('P2', '')
    const b1: Omit<ProjektBerechnung, 'id'> = {
      formelId: 'a',
      formelName: 'A',
      kategorie: 'K',
      bekannt: {},
      ziel: 'x',
      ergebnis: { x: 1 },
      quelle: { werk: 'Quelle A' },
      verifiziert: false,
      richtwert: false,
      zeitpunkt: 1,
    }
    const b2: Omit<ProjektBerechnung, 'id'> = {
      formelId: 'b',
      formelName: 'B',
      kategorie: 'K',
      bekannt: {},
      ziel: 'y',
      ergebnis: { y: 2 },
      quelle: { werk: 'Quelle B' },
      verifiziert: true,
      richtwert: true,
      zeitpunkt: 2,
    }
    projektBerechnungHinzufuegen(projekt.id, b1)
    projektBerechnungHinzufuegen(projekt.id, b2)

    const nachReload = getProjekt(projekt.id)!
    expect(nachReload.berechnungen.map((b) => b.formelId)).toEqual(['b', 'a'])
    expect(nachReload.berechnungen[0]).toMatchObject(b2)
    expect(nachReload.berechnungen[1]).toMatchObject(b1)
  })
})
