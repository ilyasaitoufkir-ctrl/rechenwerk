import type { Formula } from '../../types/formula'
import { statischeAmortisation as berechneAmortisation } from '../../lib/wirtschaftlichkeit'

export const statischeAmortisation: Formula = {
  id: 'statische-amortisation',
  name: 'Statische Amortisationszeit',
  kategorie: 'Energie & Kosten',
  stichworte: ['amortisation', 'payback', 'wirtschaftlichkeit', 'investition'],
  latex: 't = \\dfrac{I}{E}',
  variablen: [
    { id: 'I', symbol: 'I', name: 'Investition', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'E', symbol: 'E', name: 'Jährliche Einsparung', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 't', symbol: 't', name: 'Amortisationszeit', dimension: 'time', defaultUnit: 'a' },
  ],
  zielgroessen: ['t', 'I', 'E'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 't') {
      // t intern in Jahren, SI der Dimension 'time' ist Sekunden -> Jahr = 365,25*86400s (julianisches Jahr)
      const tJahre = berechneAmortisation(bekannt.I, bekannt.E)
      return { t: tJahre * 365.25 * 86400 }
    }
    if (ziel === 'I') return { I: (bekannt.t / (365.25 * 86400)) * bekannt.E }
    if (ziel === 'E') {
      const tJahre = bekannt.t / (365.25 * 86400)
      if (tJahre <= 0) throw new Error('Amortisationszeit muss größer 0 sein')
      return { E: bekannt.I / tJahre }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Einfache (statische) Payback-Methode ohne Zinseffekt, konstante jährliche Einsparung vorausgesetzt',
  annahmen: ['Jährliche Einsparung über die gesamte Amortisationszeit konstant', 'Keine Verzinsung berücksichtigt (siehe dazu Kapitalwert/Interner Zinsfuß)'],
  quelle: { werk: 'VDI 2067' },
  beispiel: {
    // I=10000€, E=2500€/Jahr -> t=4 Jahre = 4*365,25*86400 s
    bekannt: { I: 10000, E: 2500 },
    ziel: 't',
    erwartet: { t: 4 * 365.25 * 86400 },
    toleranzRelativ: 1e-9,
  },
}
