import type { Formula } from '../../types/formula'

export const stehenderZylinderFuellstand: Formula = {
  id: 'stehender-zylinder-fuellstand',
  name: 'Stehender Zylinder, Füllstand',
  kategorie: 'Behälter & Geometrie',
  stichworte: ['stehender zylinder', 'füllstand', 'tank', 'behälter', 'prozent'],
  latex: 'V = \\dfrac{\\pi \\, d^2}{4} \\, h \\qquad \\text{Füllstand} = \\dfrac{h}{H_{ges}} \\cdot 100\\,\\%',
  variablen: [
    { id: 'd', symbol: 'd', name: 'Innendurchmesser', dimension: 'length', defaultUnit: 'mm' },
    { id: 'Hges', symbol: 'H_{ges}', name: 'Gesamthöhe Behälter', dimension: 'length', defaultUnit: 'm' },
    { id: 'h', symbol: 'h', name: 'Füllhöhe', dimension: 'length', defaultUnit: 'm', min: 0 },
    { id: 'V', symbol: 'V', name: 'Füllvolumen', dimension: 'volume', defaultUnit: 'l' },
    { id: 'fuellstand', symbol: '\\%', name: 'Füllstand', dimension: 'dimensionless', defaultUnit: 'pct' },
  ],
  zielgroessen: ['V', 'h'],
  zusatzAusgaben: ['fuellstand'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (bekannt.d <= 0) throw new Error('Durchmesser muss größer 0 sein')
    if (bekannt.Hges <= 0) throw new Error('Gesamthöhe muss größer 0 sein')
    const flaeche = (Math.PI * bekannt.d ** 2) / 4
    if (ziel === 'V') {
      if (bekannt.h < 0 || bekannt.h > bekannt.Hges) throw new Error('Füllhöhe muss zwischen 0 und der Gesamthöhe liegen')
      const V = flaeche * bekannt.h
      // SI der Dimension 'dimensionless' ist der Anteil (0-1), nicht der Prozentwert
      return { V, fuellstand: bekannt.h / bekannt.Hges }
    }
    if (ziel === 'h') {
      const h = bekannt.V / flaeche
      if (h > bekannt.Hges) throw new Error('Volumen übersteigt das Fassungsvermögen des Behälters')
      return { h, fuellstand: h / bekannt.Hges }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Stehender Kreiszylinder mit ebenem Boden und ebener Decke',
  annahmen: ['Ebener Boden (bei gewölbtem Boden Volumen separat addieren)'],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau', kapitel: 'Geometrische Grundformeln' },
  beispiel: {
    // d=1m, Hges=2,5m, h=1,5m -> V=π*0,25*1,5=1,1780972 m³, Füllstand=1,5/2,5=0,6 (=60%)
    bekannt: { d: 1, Hges: 2.5, h: 1.5 },
    ziel: 'V',
    erwartet: { V: 1.1780972, fuellstand: 0.6 },
    toleranzRelativ: 1e-5,
  },
}
