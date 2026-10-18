import { describe, it, expect } from 'vitest'
import { alleFormeln } from '../formulas/registry'
import { brent, loeseNachVariable, benoetigteEingaben } from './loeser'

describe('brent (Standardalgorithmus)', () => {
  it('findet die Nullstelle von x² - 4 im Intervall [0, 10] (x = 2)', () => {
    expect(brent((x) => x * x - 4, 0, 10)).toBeCloseTo(2, 8)
  })

  it('findet die Nullstelle von cos(x) - x (klassisches Brent-Testbeispiel)', () => {
    const x = brent((v) => Math.cos(v) - v, 0, 1)
    expect(Math.cos(x) - x).toBeCloseTo(0, 9)
  })

  it('wirft ohne Vorzeichenwechsel im Intervall', () => {
    expect(() => brent((x) => x * x + 1, -1, 1)).toThrow()
  })
})

describe('loeseNachVariable: numerisches Auflösen am Beispiel Darcy-Weisbach', () => {
  const druckverlust = alleFormeln.find((f) => f.id === 'druckverlust-darcy-weisbach')!

  it('löst nach dem Innendurchmesser d bei bekanntem Δp - Kontrolle per Vorwärtsrechnung', () => {
    // dp = (lambda*(L/d) + zeta) * rho*v²/2, bekannt: lambda=0.02, L=100, zeta=2, rho=1000, v=2, dp=44000 (d=0.1 erwartet)
    const ergebnis = loeseNachVariable(druckverlust, 'd', { lambda: 0.02, L: 100, zeta: 2, rho: 1000, v: 2, dp: 44000 })
    expect(ergebnis.methode).toBe('numerisch')
    expect(ergebnis.kandidaten).toHaveLength(1)
    expect(ergebnis.kandidaten[0].wert).toBeCloseTo(0.1, 6)
    expect(ergebnis.kandidaten[0].kontrolle.dp).toBeCloseTo(44000, 3)
  })

  it('meldet einen Fehler, wenn der Zielwert (dp) nicht mitgegeben wird', () => {
    const ergebnis = loeseNachVariable(druckverlust, 'd', { lambda: 0.02, L: 100, zeta: 2, rho: 1000, v: 2 })
    expect(ergebnis.kandidaten).toHaveLength(0)
    expect(ergebnis.fehler).toBeDefined()
  })

  it('benoetigteEingaben für eine reine Eingabevariable enthält die Zielgröße, aber nicht zusatzAusgaben', () => {
    const eingaben = benoetigteEingaben(druckverlust, 'd')
    expect(eingaben).toContain('dp')
    expect(eingaben).not.toContain('h') // zusatzAusgabe
    expect(eingaben).not.toContain('d')
  })
})

describe('loeseNachVariable: Mehrdeutigkeit wird erkannt statt stillschweigend eine Lösung zu wählen', () => {
  it('ein künstliches Beispiel mit zwei Vorzeichenwechseln liefert zwei Kandidaten', () => {
    // f(x) = x² - 4 als "Formel": ziel = 'y', Eingabe = 'x', y = x² - 4 hat zwei Nullstellen (x=±2)
    // wenn y = 0 als bekannt vorgegeben wird.
    const quadratisch = {
      id: 'test-quadratisch',
      name: 'Test',
      kategorie: 'Test',
      stichworte: [],
      latex: 'y = x^2 - 4',
      variablen: [
        { id: 'x', symbol: 'x', name: 'x', dimension: 'dimensionless' as const, defaultUnit: '_' },
        { id: 'y', symbol: 'y', name: 'y', dimension: 'dimensionless' as const, defaultUnit: '_' },
      ],
      zielgroessen: ['y'],
      compute: (bekannt: Record<string, number>, ziel: string) => {
        if (ziel !== 'y') throw new Error('unbekannt')
        return { y: bekannt.x * bekannt.x - 4 }
      },
      gueltigkeit: 'Test',
      annahmen: [],
      quelle: { werk: 'Test' },
      beispiel: { bekannt: { x: 2 }, ziel: 'y', erwartet: { y: 0 } },
    }

    const ergebnis = loeseNachVariable(quadratisch, 'x', { y: 0 })
    expect(ergebnis.methode).toBe('numerisch')
    expect(ergebnis.kandidaten.length).toBeGreaterThanOrEqual(2)
    const werte = ergebnis.kandidaten.map((k) => Math.round(k.wert))
    expect(werte).toContain(2)
    expect(werte).toContain(-2)
  })
})

describe('loeseNachVariable: automatischer Rückrechnungstest über die GESAMTE Formel-Registry', () => {
  // Formeln mit Schicht-/Komponentenfeld haben kein flaches bekannt-Objekt (Tabelleneingabe) -
  // für diese ist generisches Auflösen nach einer Eingabevariable nicht sinnvoll definierbar,
  // genau wie beim bestehenden Assistenten-Werkzeug (siehe ki-werkzeuge.ts) ausgeschlossen.
  const testbareFormeln = alleFormeln.filter((f) => !f.schichtfeld && !f.komponentenfeld)

  it('jede testbare Formel hat ein Beispiel mit mindestens einer Eingabe', () => {
    for (const f of testbareFormeln) {
      expect(Object.keys(f.beispiel.bekannt).length, `Formel "${f.id}" ohne Beispiel-Eingaben`).toBeGreaterThan(0)
    }
  })

  interface Ergebniszeile {
    formelId: string
    variable: string
    methode: 'analytisch' | 'numerisch' | 'fehler'
    mehrdeutig: boolean
    bestanden: boolean
  }

  const protokoll: Ergebniszeile[] = []

  /**
   * Variablen, die sich in dieser Richtung nicht auflösen lassen - jeweils manuell geprüft und
   * verstanden, bevor sie hier aufgenommen wurden (siehe Begründung je Zeile). Das ist bewusst
   * keine pauschale Ausnahme, sondern eine Positivliste: jeder Eintrag steht für einen konkret
   * nachvollzogenen Grund. Verschwindet ein Eintrag hier plötzlich (weil die Formel geändert
   * wurde und die Variable jetzt doch relevant ist), MUSS der zugehörige Test wieder grün sein -
   * taucht ein NEUER unbekannter Fall auf, schlägt der Test absichtlich fehl statt ihn zu verstecken.
   */
  const BEKANNTE_EINSCHRAENKUNGEN: Record<string, string> = {
    // Variable fließt nur in eine zusatzAusgabe ein, nicht in die geprüfte Zielgröße selbst:
    'waermeverlust-rohr-daemmung.alphaABlank': 'wirkt nur auf Qdot_L_ungedaemmt (zusatzAusgabe)',
    'waermeverlust-rohr-daemmung.Lrohr': 'wirkt nur auf die Einsparungs-zusatzAusgaben',
    'waermeverlust-rohr-daemmung.betriebsstunden': 'wirkt nur auf die Einsparungs-zusatzAusgaben',
    'waermeverlust-rohr-daemmung.waermepreis': 'wirkt nur auf einsparungEuroJahr (zusatzAusgabe)',
    'dampfkosten.betriebsstunden': 'wirkt nur auf kostenProJahr (zusatzAusgabe)',
    'druckluft-leckage.rhoAnsaug': 'wirkt nur auf mehrleistung/kostenProJahr (zusatzAusgaben)',
    'druckluft-leckage.spezLeistung': 'wirkt nur auf mehrleistung/kostenProJahr (zusatzAusgaben)',
    'druckluft-leckage.betriebsstunden': 'wirkt nur auf kostenProJahr (zusatzAusgabe)',
    'druckluft-leckage.strompreis': 'wirkt nur auf kostenProJahr (zusatzAusgabe)',
    'npsh.npshR': 'wird nur durchgereicht für warnungen()/empfehlung(), nicht Teil von NPSHA',
    'npsh.zuschlag': 'wird nur durchgereicht für warnungen()/empfehlung(), nicht Teil von NPSHA',
    'affinitaetsgesetze.H1': 'wirkt nur auf H2 (zusatzAusgabe), nicht auf die Zielgröße V2',
    'affinitaetsgesetze.P1': 'wirkt nur auf P2 (zusatzAusgabe), nicht auf die Zielgröße V2',
    'dosier-kalibrierung.rho': 'wirkt nur auf sollMasse/istMasse (zusatzAusgaben)',
    'stehender-zylinder-fuellstand.Hges': 'nur Kontextgröße (Behältergesamthöhe), nicht Teil von V/h',
    'zylinderschale-en13445.c1': 'wirkt nur auf eBestell (zusatzAusgabe), nicht auf e/P',
    'zylinderschale-en13445.c2': 'wirkt nur auf eBestell (zusatzAusgabe), nicht auf e/P',
    'kugelschale-en13445.c1': 'wirkt nur auf eBestell (zusatzAusgabe), nicht auf e/P',
    'kugelschale-en13445.c2': 'wirkt nur auf eBestell (zusatzAusgabe), nicht auf e/P',
    // Mit den konkreten Beispielwerten dieser Formel (Faktor 0) ist die Variable im Beispiel ohne Wirkung:
    'stromkosten.leistungspreis': 'Beispiel hat leistung=0 -> leistungspreis ohne Wirkung auf kosten',
    'stromkosten.leistung': 'Beispiel hat leistungspreis=0 -> leistung ohne Wirkung auf kosten',
    'pruefdruck-dgrl.fa': 'Beispiel hat fa=ft -> der ft-unabhängige max()-Zweig (1,43·PS) gewinnt',
    'pruefdruck-dgrl.ft': 'Beispiel hat fa=ft -> der ft-unabhängige max()-Zweig (1,43·PS) gewinnt',
    'sicherheitsventil-gas-dampf.p2': 'Beispiel ist kritische (schallnahe) Ausströmung - mdot unabhängig vom Gegendruck p2',
    'taupunkt.A2': 'Beispiel hat y1=1 (reine Komponente 1) -> Komponente-2-Koeffizienten ohne Wirkung',
    'taupunkt.B2': 'Beispiel hat y1=1 (reine Komponente 1) -> Komponente-2-Koeffizienten ohne Wirkung',
    'taupunkt.C2': 'Beispiel hat y1=1 (reine Komponente 1) -> Komponente-2-Koeffizienten ohne Wirkung',
    // Kategorische Auswahlgrößen (keine stetige Zahl, nicht sinnvoll per Brent invertierbar):
    'dgrl-einstufung-behaelter.zustand': 'kategorische Auswahl (Aggregatzustand), kein stetiger Wert',
    'dgrl-einstufung-behaelter.fluidgruppe': 'kategorische Auswahl (Fluidgruppe), kein stetiger Wert',
    'dgrl-einstufung-rohrleitung.zustand': 'kategorische Auswahl (Aggregatzustand), kein stetiger Wert',
    'dgrl-einstufung-rohrleitung.fluidgruppe': 'kategorische Auswahl (Fluidgruppe), kein stetiger Wert',
    // Formelintern bereits numerisch (verschachtelte Bisektion) - Inversion des Antoine-Koeffizienten
    // C ist in der Praxis zu schlecht konditioniert für den generischen äußeren Löser:
    'siedepunkt.C1': 'C-Koeffizient einer intern per Bisektion gelösten Antoine-Gleichung',
    'siedepunkt.C2': 'C-Koeffizient einer intern per Bisektion gelösten Antoine-Gleichung',
    'taupunkt.C1': 'C-Koeffizient einer intern per Bisektion gelösten Antoine-Gleichung',
  }

  for (const formel of testbareFormeln) {
    describe(`${formel.id}`, () => {
      const { bekannt, ziel } = formel.beispiel
      let roh: Record<string, number>
      try {
        roh = formel.compute(bekannt, ziel)
      } catch {
        roh = {}
      }
      const vollBekannt = { ...bekannt, ...roh }

      for (const eingabeId of Object.keys(bekannt)) {
        const schluessel = `${formel.id}.${eingabeId}`
        const einschraenkungsgrund = BEKANNTE_EINSCHRAENKUNGEN[schluessel]

        it(`löst korrekt nach "${eingabeId}" auf (Rückrechnung aus dem Beispiel)`, () => {
          const bekanntRest = { ...vollBekannt }
          const originalWert = bekanntRest[eingabeId]
          delete bekanntRest[eingabeId]

          const ergebnis = loeseNachVariable(formel, eingabeId, bekanntRest)
          const mehrdeutig = ergebnis.kandidaten.length > 1

          if (ergebnis.kandidaten.length === 0) {
            protokoll.push({ formelId: formel.id, variable: eingabeId, methode: 'fehler', mehrdeutig: false, bestanden: Boolean(einschraenkungsgrund) })
            if (einschraenkungsgrund) return // bekannte, geprüfte Einschränkung - kein echter Fehler
            throw new Error(`Keine Lösung für ${schluessel}: ${ergebnis.fehler}`)
          }

          // Bei Mehrdeutigkeit muss der ursprüngliche Beispielwert unter den gefundenen Kandidaten sein.
          const treffer = ergebnis.kandidaten.some((k) => Math.abs(k.wert - originalWert) <= 1e-6 * Math.max(1, Math.abs(originalWert)))

          protokoll.push({
            formelId: formel.id,
            variable: eingabeId,
            methode: ergebnis.methode,
            mehrdeutig,
            bestanden: treffer,
          })

          expect(treffer, `${schluessel}: erwartet ${originalWert}, Kandidaten: ${JSON.stringify(ergebnis.kandidaten.map((k) => k.wert))}`).toBe(true)
        })
      }
    })
  }

  it('Protokoll: Zusammenfassung über alle geprüften Formel/Variable-Kombinationen', () => {
    const analytisch = protokoll.filter((p) => p.methode === 'analytisch').length
    const numerisch = protokoll.filter((p) => p.methode === 'numerisch').length
    const mehrdeutige = protokoll.filter((p) => p.mehrdeutig)
    // eslint-disable-next-line no-console
    console.log(
      `[Auflösen-Protokoll] ${testbareFormeln.length} Formeln, ${protokoll.length} Formel/Variable-Kombinationen geprüft - ` +
        `${analytisch} analytisch, ${numerisch} numerisch, ${mehrdeutige.length} mit erkannter Mehrdeutigkeit` +
        (mehrdeutige.length > 0 ? `: ${mehrdeutige.map((m) => `${m.formelId}.${m.variable}`).join(', ')}` : ''),
    )
    expect(testbareFormeln.length).toBeGreaterThan(0)
  })
})
