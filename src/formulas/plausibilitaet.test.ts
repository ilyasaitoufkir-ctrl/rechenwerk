import { describe, it, expect } from 'vitest'
import { alleFormeln } from './registry'
import { fromSI } from '../units'

/**
 * Pflicht-Audit (ab Phase 4): rechnet für jede Formel das hinterlegte
 * Beispiel durch, wandelt jedes Ergebnis in die Anzeigeeinheit zurück und
 * prüft auf grobe Plausibilität. Ein reiner "compute() == erwartet"-Test
 * (siehe registry.test.ts) kann einen Fehler nicht erkennen, wenn Testwert
 * und Implementierung denselben falschen SI-Bezug teilen (das ist in Phase 3
 * zweimal passiert: eine Prozentformel gab 4 statt 0,04 zurück - der Test
 * bestand, die Anzeige hätte 400% gezeigt). Dieser Test bricht den Build ab,
 * wenn sowas durchrutscht.
 */
describe('Plausibilitätsaudit: Beispiel -> Anzeigeeinheit -> Größenordnung', () => {
  for (const formel of alleFormeln) {
    it(`${formel.id}: alle Ausgaben sind endlich und in plausibler Größenordnung`, () => {
      const { bekannt, ziel } = formel.beispiel
      const ergebnis = formel.compute(bekannt, ziel)

      const ausgabeIds = new Set([ziel, ...(formel.zusatzAusgaben ?? [])])
      for (const id of ausgabeIds) {
        const variable = formel.variablen.find((v) => v.id === id)
        expect(variable, `Variable "${id}" von ${formel.id} fehlt in variablen[]`).toBeTruthy()
        if (!variable) continue

        const siWert = ergebnis[id]
        expect(Number.isFinite(siWert), `${formel.id}.${id}: SI-Ergebnis ist nicht endlich (${siWert})`).toBe(true)

        const anzeige = fromSI(siWert, variable.dimension, variable.defaultUnit)
        expect(
          Number.isFinite(anzeige),
          `${formel.id}.${id}: Anzeigewert nicht endlich nach fromSI (${anzeige})`,
        ).toBe(true)

        // Prozentwerte: typischer Verdachtsbereich für einen 100er-Skalierungsfehler
        // (SI-Bruch vs. bereits-skalierter Prozentwert, siehe Phase-3-Bugs).
        if (variable.defaultUnit === 'pct') {
          expect(
            Math.abs(anzeige),
            `${formel.id}.${id}: Prozentwert ${anzeige}% wirkt wie ein 100er-Skalierungsfehler (SI-Bruch vs. Prozent vertauscht?)`,
          ).toBeLessThan(1000)
        }
      }
    })
  }
})
