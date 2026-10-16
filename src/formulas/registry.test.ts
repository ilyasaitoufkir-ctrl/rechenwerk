import { describe, it, expect } from 'vitest'
import { alleFormeln } from './registry'

describe('Formel-Registry: Pflichtfelder', () => {
  for (const formel of alleFormeln) {
    describe(formel.id, () => {
      it('hat id, name, kategorie', () => {
        expect(formel.id).toBeTruthy()
        expect(formel.name).toBeTruthy()
        expect(formel.kategorie).toBeTruthy()
      })

      it('hat mindestens ein Stichwort', () => {
        expect(formel.stichworte.length).toBeGreaterThan(0)
      })

      it('hat LaTeX-Formel', () => {
        expect(formel.latex).toBeTruthy()
      })

      it('hat mindestens eine Variable mit vollständigen Pflichtfeldern', () => {
        expect(formel.variablen.length).toBeGreaterThan(0)
        for (const v of formel.variablen) {
          expect(v.id).toBeTruthy()
          expect(v.symbol).toBeTruthy()
          expect(v.name).toBeTruthy()
          expect(v.dimension).toBeTruthy()
          expect(v.defaultUnit).toBeTruthy()
        }
      })

      it('hat mindestens eine Zielgröße, die auch als Variable existiert', () => {
        expect(formel.zielgroessen.length).toBeGreaterThan(0)
        const variablenIds = formel.variablen.map((v) => v.id)
        for (const z of formel.zielgroessen) {
          expect(variablenIds).toContain(z)
        }
      })

      it('hat eine compute-Funktion', () => {
        expect(typeof formel.compute).toBe('function')
      })

      it('hat Gültigkeitsbereich und Annahmen', () => {
        expect(formel.gueltigkeit).toBeTruthy()
        expect(Array.isArray(formel.annahmen)).toBe(true)
      })

      it('hat eine Quelle mit Werk', () => {
        expect(formel.quelle).toBeTruthy()
        expect(formel.quelle.werk).toBeTruthy()
      })

      it('hat ein vollständiges Beispiel', () => {
        expect(formel.beispiel).toBeTruthy()
        expect(formel.beispiel.bekannt).toBeTruthy()
        expect(formel.beispiel.ziel).toBeTruthy()
        expect(formel.beispiel.erwartet).toBeTruthy()
      })
    })
  }

  it('alle Formel-IDs sind eindeutig', () => {
    const ids = alleFormeln.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('Formel-Registry: Beispiele stimmen mit compute() überein', () => {
  for (const formel of alleFormeln) {
    it(`${formel.id}: Beispiel reproduzierbar`, () => {
      const { bekannt, ziel, erwartet, toleranzRelativ = 1e-6 } = formel.beispiel
      const ergebnis = formel.compute(bekannt, ziel)
      for (const [key, wert] of Object.entries(erwartet)) {
        expect(ergebnis[key], `Feld "${key}"`).toBeDefined()
        if (wert === 0) {
          expect(Math.abs(ergebnis[key])).toBeLessThan(1e-9)
        } else {
          expect(Math.abs(ergebnis[key] - wert) / Math.abs(wert)).toBeLessThan(toleranzRelativ)
        }
      }
    })
  }
})
