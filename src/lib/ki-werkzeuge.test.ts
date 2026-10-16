import { describe, it, expect } from 'vitest'
import { erzeugeWerkzeuge, fuehreWerkzeugAus } from './ki-werkzeuge'
import { alleFormeln, getFormel } from '../formulas/registry'
import { fromSI } from '../units'

describe('erzeugeWerkzeuge', () => {
  const werkzeuge = erzeugeWerkzeuge()

  it('erzeugt genau die 5 spezifizierten Werkzeuge', () => {
    expect(werkzeuge.map((w) => w.name)).toEqual([
      'formeln_suchen',
      'formel_details',
      'formel_berechnen',
      'einheit_umrechnen',
      'stoffdaten_abfragen',
    ])
  })

  it('jedes Werkzeug hat ein gültiges JSON-Schema (object, additionalProperties false, required vorhanden)', () => {
    for (const w of werkzeuge) {
      expect(w.input_schema.type).toBe('object')
      expect(w.input_schema.additionalProperties).toBe(false)
      expect(w.input_schema.required!.length).toBeGreaterThan(0)
      expect(w.description.length).toBeGreaterThan(10)
    }
  })
})

describe('formeln_suchen', () => {
  it('findet eine bekannte Formel über ein Stichwort', () => {
    const r = fuehreWerkzeugAus('formeln_suchen', { query: 'Reynolds' })
    const payload = r.fuerClaude as { treffer: { id: string }[] }
    expect(payload.treffer.some((t) => t.id === 'reynolds')).toBe(true)
  })
})

describe('formel_details', () => {
  it('liefert Variablen-IDs und Standardeinheiten passend zur Registry', () => {
    const formel = getFormel('reynolds')!
    const r = fuehreWerkzeugAus('formel_details', { id: 'reynolds' })
    const payload = r.fuerClaude as { variablen: { id: string; standardEinheit: string }[] }
    for (const v of formel.variablen) {
      const gefunden = payload.variablen.find((x) => x.id === v.id)
      expect(gefunden?.standardEinheit).toBe(v.defaultUnit)
    }
  })

  it('liefert einen Fehler für eine unbekannte ID statt zu werfen', () => {
    const r = fuehreWerkzeugAus('formel_details', { id: 'gibt-es-nicht' })
    expect((r.fuerClaude as { fehler: string }).fehler).toMatch(/nicht gefunden/)
  })
})

describe('formel_berechnen: Parität mit formel.compute für jede berechenbare Formel', () => {
  const berechenbar = alleFormeln.filter((f) => !f.schichtfeld && !f.komponentenfeld)

  it(`deckt alle ${berechenbar.length} berechenbaren Formeln der Registry ab`, () => {
    expect(berechenbar.length).toBeGreaterThan(0)
  })

  for (const formel of berechenbar) {
    it(`${formel.id}: Werkzeug-Ergebnis stimmt mit direktem compute() überein`, () => {
      const { bekannt, ziel, erwartet } = formel.beispiel
      const ausgabeIds = new Set([ziel, ...(formel.zusatzAusgaben ?? [])])
      const eingabeVariablen = formel.variablen.filter((v) => !ausgabeIds.has(v.id))

      const werte: Record<string, { wert: number; einheit: string }> = {}
      for (const v of eingabeVariablen) {
        werte[v.id] = { wert: fromSI(bekannt[v.id], v.dimension, v.defaultUnit), einheit: v.defaultUnit }
      }

      const r = fuehreWerkzeugAus('formel_berechnen', { id: formel.id, ziel, werte })
      const payload = r.fuerClaude as {
        fehler?: string
        ergebnisse?: { id: string; wertSI: number }[]
      }
      expect(payload.fehler).toBeUndefined()
      const zielErgebnis = payload.ergebnisse!.find((e) => e.id === ziel)!
      // Relativer statt absoluter Vergleich: der Roundtrip SI -> Anzeigeeinheit -> SI
      // (wie ein echter Werkzeugaufruf ihn durchläuft) verliert bei großen Beträgen
      // sonst durch die feste Dezimalstellenzahl von toBeCloseTo Präzision.
      if (erwartet[ziel] === 0) {
        expect(zielErgebnis.wertSI).toBeCloseTo(0, 6)
      } else {
        const relativeAbweichung = Math.abs((zielErgebnis.wertSI - erwartet[ziel]) / erwartet[ziel])
        expect(relativeAbweichung).toBeLessThan(1e-5)
      }
    })
  }

  it('lehnt eine Berechnung mit fehlenden Werten mit einer verständlichen Fehlermeldung ab (statt zu werfen)', () => {
    const r = fuehreWerkzeugAus('formel_berechnen', { id: 'reynolds', ziel: 'Re', werte: {} })
    expect((r.fuerClaude as { fehler: string }).fehler).toMatch(/fehlen Werte/)
  })

  it('lehnt eine ungültige Zielgröße ab', () => {
    const r = fuehreWerkzeugAus('formel_berechnen', { id: 'reynolds', ziel: 'quatsch', werte: {} })
    expect((r.fuerClaude as { fehler: string }).fehler).toMatch(/ungültig/i)
  })

  it('lehnt Formeln mit schichtfeld/komponentenfeld ab statt falsch zu rechnen', () => {
    const mitSchicht = alleFormeln.find((f) => f.schichtfeld)!
    const r = fuehreWerkzeugAus('formel_berechnen', { id: mitSchicht.id, ziel: mitSchicht.zielgroessen[0], werte: {} })
    expect((r.fuerClaude as { fehler: string }).fehler).toMatch(/mehrschichtige|tabellarische/)
  })

  it('liefert für Druckgeräte-Formeln den Pflichthinweis mit', () => {
    const formel = alleFormeln.find((f) => f.kategorie === 'Druckgeräte' && !f.schichtfeld && !f.komponentenfeld)!
    const { bekannt, ziel } = formel.beispiel
    const ausgabeIds = new Set([ziel, ...(formel.zusatzAusgaben ?? [])])
    const werte: Record<string, { wert: number; einheit: string }> = {}
    for (const v of formel.variablen.filter((x) => !ausgabeIds.has(x.id))) {
      werte[v.id] = { wert: fromSI(bekannt[v.id], v.dimension, v.defaultUnit), einheit: v.defaultUnit }
    }
    const r = fuehreWerkzeugAus('formel_berechnen', { id: formel.id, ziel, werte })
    expect((r.fuerClaude as { pflichthinweis?: string }).pflichthinweis).toBeDefined()
  })

  it('liefert einen rechnerLink für "Im Rechner öffnen"', () => {
    const formel = getFormel('reynolds')!
    const { bekannt, ziel } = formel.beispiel
    const ausgabeIds = new Set([ziel, ...(formel.zusatzAusgaben ?? [])])
    const werte: Record<string, { wert: number; einheit: string }> = {}
    for (const v of formel.variablen.filter((x) => !ausgabeIds.has(x.id))) {
      werte[v.id] = { wert: fromSI(bekannt[v.id], v.dimension, v.defaultUnit), einheit: v.defaultUnit }
    }
    const r = fuehreWerkzeugAus('formel_berechnen', { id: formel.id, ziel, werte })
    expect(r.rechnerLink?.formelId).toBe('reynolds')
    expect(r.rechnerLink?.ziel).toBe(ziel)
  })
})

describe('einheit_umrechnen', () => {
  it('rechnet 1 bar in Pa um', () => {
    const r = fuehreWerkzeugAus('einheit_umrechnen', { wert: 1, von: 'bar', nach: 'Pa' })
    expect((r.fuerClaude as { ergebnis: number }).ergebnis).toBeCloseTo(100000, 3)
  })

  it('liefert einen Fehler statt zu werfen, wenn keine gemeinsame Dimension existiert', () => {
    const r = fuehreWerkzeugAus('einheit_umrechnen', { wert: 1, von: 'bar', nach: 'kg' })
    expect((r.fuerClaude as { fehler: string }).fehler).toBeDefined()
  })
})

describe('stoffdaten_abfragen', () => {
  it('liefert gefilterte Zeilen einer bekannten Tabelle', () => {
    const r = fuehreWerkzeugAus('stoffdaten_abfragen', { tabelle: 'tabelle-werkstoffdichten', suchbegriff: 'Edelstahl' })
    const payload = r.fuerClaude as { zeilen: unknown[] }
    expect(payload.zeilen.length).toBeGreaterThan(0)
  })

  it('liefert einen Fehler für eine unbekannte Tabelle', () => {
    const r = fuehreWerkzeugAus('stoffdaten_abfragen', { tabelle: 'nicht-vorhanden' })
    expect((r.fuerClaude as { fehler: string }).fehler).toBeDefined()
  })
})

describe('fuehreWerkzeugAus: unbekanntes Werkzeug', () => {
  it('liefert einen Fehler statt zu werfen', () => {
    const r = fuehreWerkzeugAus('nicht_existent', {})
    expect((r.fuerClaude as { fehler: string }).fehler).toMatch(/Unbekanntes Werkzeug/)
  })
})
