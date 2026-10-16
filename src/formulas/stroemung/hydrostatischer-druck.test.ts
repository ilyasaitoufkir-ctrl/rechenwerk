import { describe, it, expect } from 'vitest'
import { hydrostatischerDruck } from './hydrostatischer-druck'

describe('Hydrostatischer Druck', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = hydrostatischerDruck.beispiel
    const ergebnis = hydrostatischerDruck.compute(bekannt, ziel)
    expect(ergebnis.p).toBeCloseTo(erwartet.p, 4)
  })

  it('Handrechnung: h aus p und ρ (unabhängig vom Beispiel)', () => {
    // Handrechnung: h = p/(ρ*g) = 200000/(1000*9,80665) = 20,394324 m
    const ergebnis = hydrostatischerDruck.compute({ p: 200000, rho: 1000 }, 'h')
    expect(ergebnis.h).toBeCloseTo(20.394324, 5)
  })

  it('löst auch nach ρ auf', () => {
    const ergebnis = hydrostatischerDruck.compute({ p: 98066.5, h: 10 }, 'rho')
    expect(ergebnis.rho).toBeCloseTo(1000, 6)
  })

  it('wirft Fehler bei ρ <= 0 (ziel h) bzw. h <= 0 (ziel ρ)', () => {
    expect(() => hydrostatischerDruck.compute({ p: 1000, rho: 0 }, 'h')).toThrow()
    expect(() => hydrostatischerDruck.compute({ p: 1000, h: 0 }, 'rho')).toThrow()
  })
})
