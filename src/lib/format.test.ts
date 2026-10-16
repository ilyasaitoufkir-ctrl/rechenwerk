import { describe, it, expect } from 'vitest'
import { parseDecimal, roundToSignificant, formatNumber } from './format'

describe('parseDecimal', () => {
  it('akzeptiert Punkt als Dezimaltrenner', () => {
    expect(parseDecimal('3.14')).toBeCloseTo(3.14, 9)
  })

  it('akzeptiert Komma als Dezimaltrenner', () => {
    expect(parseDecimal('3,14')).toBeCloseTo(3.14, 9)
  })

  it('behandelt Punkte als Tausendertrennzeichen, wenn ein Komma vorhanden ist', () => {
    expect(parseDecimal('1.234,5')).toBeCloseTo(1234.5, 9)
  })

  it('behandelt mehrere Punkte ohne Komma als Tausendertrennzeichen', () => {
    expect(parseDecimal('1.234.567')).toBe(1234567)
  })

  it('gibt null für leeren oder nur aus Leerraum bestehenden Text zurück (nicht 0)', () => {
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('   ')).toBeNull()
    expect(parseDecimal('\t\n')).toBeNull()
  })

  it('gibt null für ungültigen Text zurück', () => {
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('1,2,3')).toBeNull()
  })

  it('verarbeitet negative Zahlen', () => {
    expect(parseDecimal('-5,5')).toBeCloseTo(-5.5, 9)
  })

  it('verarbeitet 0 explizit als gültige Zahl (nicht wie leer)', () => {
    expect(parseDecimal('0')).toBe(0)
  })
})

describe('roundToSignificant', () => {
  it('rundet auf die angegebene Anzahl signifikanter Stellen', () => {
    expect(roundToSignificant(123.456, 3)).toBeCloseTo(123, 9)
    expect(roundToSignificant(0.0012345, 2)).toBeCloseTo(0.0012, 9)
  })

  it('lässt 0 unverändert', () => {
    expect(roundToSignificant(0, 4)).toBe(0)
  })
})

describe('formatNumber', () => {
  it('formatiert mit deutschem Dezimalkomma', () => {
    expect(formatNumber(3.14159, 3)).toBe('3,14')
  })

  it('zeigt — für nicht-endliche Werte', () => {
    expect(formatNumber(NaN)).toBe('—')
    expect(formatNumber(Infinity)).toBe('—')
  })

  it('nutzt Exponentialschreibweise für sehr kleine/große Werte', () => {
    expect(formatNumber(0.00001234, 3)).toContain('e')
    expect(formatNumber(12345678, 3)).toContain('e')
  })
})
