import { describe, it, expect } from 'vitest'
import { freiheitsgrad, loeseBilanz, type BilanzModell } from './bilanz'

describe('freiheitsgrad', () => {
  it('erkennt ein unterbestimmtes Netz (zu wenig Vorgaben)', () => {
    const modell: BilanzModell = {
      komponenten: [{ id: 'A', name: 'A' }],
      stroeme: [{ id: 's1', name: 'S1' }, { id: 's2', name: 'S2' }],
      bloecke: [{ typ: 'produkt', id: 'p1', name: 'Produkt', eingang: 's1' }],
    }
    const fg = freiheitsgrad(modell)
    expect(fg.status).toBe('unterbestimmt')
    expect(fg.differenz).toBeLessThan(0)
  })

  it('erkennt ein überbestimmtes Netz (zu viele Vorgaben)', () => {
    const modell: BilanzModell = {
      komponenten: [{ id: 'A', name: 'A' }],
      stroeme: [{ id: 's1', name: 'S1' }],
      bloecke: [
        { typ: 'zulauf', id: 'z1', name: 'Zulauf 1', ausgang: 's1', massenstromKgH: 100, anteile: { A: 1 } },
        { typ: 'zulauf', id: 'z2', name: 'Zulauf 2 (widersprüchlich)', ausgang: 's1', massenstromKgH: 50, anteile: { A: 1 } },
      ],
    }
    const fg = freiheitsgrad(modell)
    expect(fg.status).toBe('ueberbestimmt')
    expect(fg.differenz).toBeGreaterThan(0)
  })

  it('ein exakt bestimmtes Netz wird als "bestimmt" erkannt', () => {
    const modell: BilanzModell = {
      komponenten: [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }],
      stroeme: [{ id: 's1', name: 'S1' }],
      bloecke: [{ typ: 'zulauf', id: 'z1', name: 'Zulauf', ausgang: 's1', massenstromKgH: 100, anteile: { A: 0.3, B: 0.7 } }],
    }
    expect(freiheitsgrad(modell).status).toBe('bestimmt')
  })
})

describe('loeseBilanz: Mischer', () => {
  it('100 kg/h mit w=0,2 und 50 kg/h mit w=0,5 ergibt 150 kg/h mit w=0,3', () => {
    const modell: BilanzModell = {
      komponenten: [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }],
      stroeme: [
        { id: 'zu1', name: 'Zulauf 1' },
        { id: 'zu2', name: 'Zulauf 2' },
        { id: 'misch', name: 'Mischstrom' },
      ],
      bloecke: [
        { typ: 'zulauf', id: 'z1', name: 'Zulauf 1', ausgang: 'zu1', massenstromKgH: 100, anteile: { A: 0.2, B: 0.8 } },
        { typ: 'zulauf', id: 'z2', name: 'Zulauf 2', ausgang: 'zu2', massenstromKgH: 50, anteile: { A: 0.5, B: 0.5 } },
        { typ: 'mischer', id: 'm1', name: 'Mischer', eingaenge: ['zu1', 'zu2'], ausgang: 'misch' },
        { typ: 'produkt', id: 'p1', name: 'Produkt', eingang: 'misch' },
      ],
    }

    const loesung = loeseBilanz(modell)
    expect(loesung.stromGesamt.misch).toBeCloseTo(150, 9)
    expect(loesung.stromAnteile.misch.A).toBeCloseTo(0.3, 9)
    expect(loesung.stromAnteile.misch.B).toBeCloseTo(0.7, 9)
    expect(loesung.bilanzfehlerKgH).toBeLessThan(1e-6)
    for (const p of loesung.pruefungAnteile) expect(p.summeAnteile).toBeCloseTo(1, 9)
  })
})

describe('loeseBilanz: Kreislauf mit Rückführung (Trenner speist zurück in den Mischer)', () => {
  it('wird ohne Iteration exakt gelöst, Gesamtbilanz geht auf', () => {
    // Zulauf (100 kg/h reines A) -> Mischer (+ Rückführung) -> Trenner: 50% des ankommenden A zum
    // Produkt (Kopf), 50% zurück in den Mischer (Sumpf/Rückführung). Komponente B kommt nicht vor,
    // testet aber mit, dass eine komplett ungenutzte Komponente nicht aus dem Tritt bringt.
    const modell: BilanzModell = {
      komponenten: [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }],
      stroeme: [
        { id: 'zulauf', name: 'Zulauf' },
        { id: 'mischstrom', name: 'Mischstrom' },
        { id: 'produkt', name: 'Produkt' },
        { id: 'rueckfuehrung', name: 'Rückführung' },
      ],
      bloecke: [
        { typ: 'zulauf', id: 'z1', name: 'Zulauf', ausgang: 'zulauf', massenstromKgH: 100, anteile: { A: 1, B: 0 } },
        { typ: 'mischer', id: 'm1', name: 'Mischer', eingaenge: ['zulauf', 'rueckfuehrung'], ausgang: 'mischstrom' },
        {
          typ: 'trenner',
          id: 't1',
          name: 'Trenner',
          eingang: 'mischstrom',
          kopfstrom: 'produkt',
          sumpfstrom: 'rueckfuehrung',
          anteilKopf: { A: 0.5, B: 1 },
        },
        { typ: 'produkt', id: 'p1', name: 'Produkt', eingang: 'produkt' },
      ],
    }

    const loesung = loeseBilanz(modell)
    // Selbstkonsistente Lösung: Rückführung trägt 100 kg/h A, Mischstrom 200 kg/h A, Produkt 100 kg/h A.
    expect(loesung.komponentenMassenstroeme.rueckfuehrung.A).toBeCloseTo(100, 6)
    expect(loesung.komponentenMassenstroeme.mischstrom.A).toBeCloseTo(200, 6)
    expect(loesung.stromGesamt.produkt).toBeCloseTo(100, 6)
    expect(loesung.bilanzfehlerKgH).toBeLessThan(1e-6) // Σ Zulauf (100) = Σ Produkt (100)
  })
})

describe('loeseBilanz: Splitter', () => {
  it('teilt einen Strom im angegebenen Verhältnis mit identischer Zusammensetzung in alle Ausgänge', () => {
    const modell: BilanzModell = {
      komponenten: [{ id: 'A', name: 'A' }],
      stroeme: [
        { id: 'zu', name: 'Zulauf' },
        { id: 's1', name: 'Ausgang 1' },
        { id: 's2', name: 'Ausgang 2' },
      ],
      bloecke: [
        { typ: 'zulauf', id: 'z1', name: 'Zulauf', ausgang: 'zu', massenstromKgH: 100, anteile: { A: 1 } },
        { typ: 'splitter', id: 'sp1', name: 'Splitter', eingang: 'zu', ausgaenge: [{ strom: 's1', anteil: 0.3 }, { strom: 's2', anteil: 0.7 }] },
        { typ: 'produkt', id: 'p1', name: 'Produkt 1', eingang: 's1' },
        { typ: 'produkt', id: 'p2', name: 'Produkt 2', eingang: 's2' },
      ],
    }
    const loesung = loeseBilanz(modell)
    expect(loesung.stromGesamt.s1).toBeCloseTo(30, 9)
    expect(loesung.stromGesamt.s2).toBeCloseTo(70, 9)
    expect(loesung.stromAnteile.s1.A).toBeCloseTo(1, 9)
  })
})

describe('loeseBilanz: verweigert die Lösung bei unter-/überbestimmten Netzen', () => {
  it('wirft mit klarer Meldung statt eine (falsche) Lösung zu raten', () => {
    const modell: BilanzModell = {
      komponenten: [{ id: 'A', name: 'A' }],
      stroeme: [{ id: 's1', name: 'S1' }, { id: 's2', name: 'S2' }],
      bloecke: [{ typ: 'produkt', id: 'p1', name: 'Produkt', eingang: 's1' }],
    }
    expect(() => loeseBilanz(modell)).toThrow(/[Uu]nterbestimmt/)
  })
})
