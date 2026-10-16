import { describe, it, expect } from 'vitest'
import { waermeverlustRohrDaemmung } from './waermeverlust-rohr-daemmung'

describe('Wärmeverlust Rohr mit Dämmung', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = waermeverlustRohrDaemmung.beispiel
    const ergebnis = waermeverlustRohrDaemmung.compute(bekannt, ziel)
    expect(ergebnis.Qdot_L_gedaemmt).toBeCloseTo(erwartet.Qdot_L_gedaemmt, 3)
    expect(ergebnis.Qdot_L_ungedaemmt).toBeCloseTo(erwartet.Qdot_L_ungedaemmt, 3)
    expect(ergebnis.einsparungKwhJahr / 3.6e6).toBeCloseTo(erwartet.einsparungKwhJahr / 3.6e6, 1)
    expect(ergebnis.einsparungEuroJahr).toBeCloseTo(erwartet.einsparungEuroJahr, 1)
  })

  it('Handrechnung mit anderen Werten (unabhängig vom Beispiel)', () => {
    // r1=40mm, r2=45mm, r3=65mm, λRohr=16, λDämm=0,035, Ti=200°C=473,15K, Tu=10°C=283,15K,
    // αa=9, αa,blank=18, L=20m, tB=6000h=21600000s, Preis=0,10 €/kWh
    // Rg = ln(45/40)/16 + ln(65/45)/0,035 + 1/(9*0,065) = 97,667267 W/m
    // Ru = ln(45/40)/16 + 1/(18*0,045) = 961,250507 W/m
    const ergebnis = waermeverlustRohrDaemmung.compute(
      {
        r1: 0.04,
        r2: 0.045,
        r3: 0.065,
        lambdaRohr: 16,
        lambdaDaemm: 0.035,
        Ti: 473.15,
        Tu: 283.15,
        alphaA: 9,
        alphaABlank: 18,
        Lrohr: 20,
        betriebsstunden: 21600000,
        waermepreis: 0.1,
      },
      'Qdot_L_gedaemmt',
    )
    expect(ergebnis.Qdot_L_gedaemmt).toBeCloseTo(97.6672746, 4)
    expect(ergebnis.Qdot_L_ungedaemmt).toBeCloseTo(961.2505068, 3)
    // einsparungKwhJahr ist SI (Joule) - zur Probe zurück in kWh umrechnen
    expect(ergebnis.einsparungKwhJahr / 3.6e6).toBeCloseTo(103629.9879, 1)
    expect(ergebnis.einsparungEuroJahr).toBeCloseTo(10362.9988, 1)
  })

  it('wirft Fehler, wenn die Radien nicht r1<r2<r3 erfüllen', () => {
    const basis = {
      r1: 0.05,
      lambdaRohr: 50,
      lambdaDaemm: 0.04,
      Ti: 400,
      Tu: 290,
      alphaA: 10,
      alphaABlank: 15,
      Lrohr: 10,
      betriebsstunden: 3600,
      waermepreis: 0.08,
    }
    expect(() => waermeverlustRohrDaemmung.compute({ ...basis, r2: 0.04, r3: 0.09 }, 'Qdot_L_gedaemmt')).toThrow()
  })

  it('warnt, wenn Medientemperatur nicht über Umgebungstemperatur liegt', () => {
    const warnungen = waermeverlustRohrDaemmung.warnungen?.(
      { Ti: 280, Tu: 290 } as Record<string, number>,
      'Qdot_L_gedaemmt',
      {},
    )
    expect(warnungen?.length).toBeGreaterThan(0)
  })
})
