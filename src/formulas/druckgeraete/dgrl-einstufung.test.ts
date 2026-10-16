import { describe, it, expect } from 'vitest'
import { dgrlEinstufungBehaelter } from './dgrl-einstufung-behaelter'
import { dgrlEinstufungRohrleitung } from './dgrl-einstufung-rohrleitung'

describe('DGRL-Einstufung Behälter (PS·V)', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = dgrlEinstufungBehaelter.beispiel
    const ergebnis = dgrlEinstufungBehaelter.compute(bekannt, ziel)
    expect(ergebnis.psV).toBeCloseTo(erwartet.psV, 6)
  })

  it('Handrechnung: PS=6 bar, V=1000 l (unabhängig vom Beispiel)', () => {
    // psV = 6*1000 = 6000 bar*l
    const ergebnis = dgrlEinstufungBehaelter.compute({ PS: 6e5, V: 1, zustand: 2, fluidgruppe: 1 }, 'psV')
    expect(ergebnis.psV).toBeCloseTo(6000, 6)
  })

  it('nennt im Hinweis Medium und Fluidgruppe passend zu den Eingaben', () => {
    const ergebnis = dgrlEinstufungBehaelter.compute({ PS: 1e6, V: 0.1, zustand: 2, fluidgruppe: 1 }, 'psV')
    const empfehlung = dgrlEinstufungBehaelter.empfehlung?.(ergebnis)
    expect(empfehlung).toContain('Flüssigkeiten')
    expect(empfehlung).toContain('Fluidgruppe 1')
  })

  it('gibt keine Kategorie I-IV aus (bewusst nicht implementiert)', () => {
    expect(dgrlEinstufungBehaelter.gueltigkeit).toContain('NICHT implementiert')
  })
})

describe('DGRL-Einstufung Rohrleitung (PS·DN)', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = dgrlEinstufungRohrleitung.beispiel
    const ergebnis = dgrlEinstufungRohrleitung.compute(bekannt, ziel)
    expect(ergebnis.psDN).toBeCloseTo(erwartet.psDN, 6)
  })

  it('Handrechnung: PS=40 bar, DN=25 (unabhängig vom Beispiel)', () => {
    const ergebnis = dgrlEinstufungRohrleitung.compute({ PS: 4e6, DN: 25, zustand: 1, fluidgruppe: 2 }, 'psDN')
    expect(ergebnis.psDN).toBeCloseTo(1000, 6)
  })

  it('nennt im Hinweis Medium und Fluidgruppe passend zu den Eingaben', () => {
    const ergebnis = dgrlEinstufungRohrleitung.compute({ PS: 1e6, DN: 50, zustand: 1, fluidgruppe: 2 }, 'psDN')
    const empfehlung = dgrlEinstufungRohrleitung.empfehlung?.(ergebnis)
    expect(empfehlung).toContain('Gase/Dämpfe')
    expect(empfehlung).toContain('Fluidgruppe 2')
  })
})
