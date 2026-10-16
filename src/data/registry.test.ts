import { describe, it, expect } from 'vitest'
import { alleDatenTabellen, getDatenTabelle, getZeilen } from './registry'

describe('Datentabellen-Registry', () => {
  it('jede registrierte Tabelle hat Zeilen', () => {
    for (const t of alleDatenTabellen) {
      expect(getZeilen(t.id).length).toBeGreaterThan(0)
    }
  })

  it('getDatenTabelle findet eine bekannte Tabelle und liefert undefined sonst', () => {
    expect(getDatenTabelle('tabelle-rauheit')?.name).toBe('Rauheitstabelle')
    expect(getDatenTabelle('unbekannt')).toBeUndefined()
  })

  it('getZeilen filtert nach Suchbegriff über alle Feldwerte', () => {
    const alle = getZeilen('tabelle-werkstoffdichten')
    const gefiltert = getZeilen('tabelle-werkstoffdichten', 'Edelstahl')
    expect(gefiltert.length).toBeGreaterThan(0)
    expect(gefiltert.length).toBeLessThan(alle.length)
  })

  it('wirft Fehler bei unbekannter Tabellen-ID', () => {
    expect(() => getZeilen('nicht-vorhanden')).toThrow()
  })
})
