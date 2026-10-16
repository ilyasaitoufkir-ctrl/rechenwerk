/**
 * Eigenes, minimales Einheitensystem. Keine externe Bibliothek, damit jeder
 * Umrechnungsfaktor nachvollziehbar und belegbar bleibt.
 *
 * Intern wird ausschließlich in SI gerechnet. Jede Dimension definiert ihre
 * SI-Basiseinheit; alle Umrechnungen laufen über toSI/fromSI dieser Einheit.
 */

export type DimensionId =
  | 'length'
  | 'area'
  | 'volume'
  | 'mass'
  | 'time'
  | 'temperature'
  | 'temperatureDelta'
  | 'pressure'
  | 'volumeFlow'
  | 'massFlow'
  | 'density'
  | 'dynamicViscosity'
  | 'kinematicViscosity'
  | 'energy'
  | 'power'
  | 'specificHeatCapacity'
  | 'velocity'
  | 'dimensionless'
  | 'thermalConductivity'
  | 'heatTransferCoefficient'
  | 'thermalResistanceArea'
  | 'specificEnthalpy'
  | 'specificVolume'
  | 'heatFlowPerLength'
  | 'calorificValue'
  | 'compressorSpecificPower'
  | 'emissionFactor'
  | 'currency'
  | 'frequency'

export interface Unit {
  id: string
  label: string
  toSI: (v: number) => number
  fromSI: (v: number) => number
}

export interface Dimension {
  id: DimensionId
  label: string
  siUnitLabel: string
  units: Unit[]
}

function linear(id: string, label: string, factor: number): Unit {
  // SI = v * factor  (factor = wert einer SI-Einheit in der gegebenen Einheit -> v_si = v / factor? siehe unten)
  // Konvention: factor = Anzahl SI-Einheiten pro 1 Einheit "id". v_SI = v * factor
  return {
    id,
    label,
    toSI: (v) => v * factor,
    fromSI: (v) => v / factor,
  }
}

const lengthUnits: Unit[] = [
  linear('mm', 'mm', 0.001),
  linear('cm', 'cm', 0.01),
  linear('m', 'm', 1),
  linear('km', 'km', 1000),
]

const areaUnits: Unit[] = [
  linear('mm2', 'mm²', 1e-6),
  linear('cm2', 'cm²', 1e-4),
  linear('m2', 'm²', 1),
]

const volumeUnits: Unit[] = [
  linear('ml', 'ml', 1e-6),
  linear('l', 'l', 1e-3),
  linear('m3', 'm³', 1),
]

const massUnits: Unit[] = [
  linear('g', 'g', 1e-3),
  linear('kg', 'kg', 1),
  linear('t', 't', 1000),
]

const timeUnits: Unit[] = [
  linear('s', 's', 1),
  linear('min', 'min', 60),
  linear('h', 'h', 3600),
  linear('d', 'd', 86400),
  // Julianisches Jahr (365,25 Tage) - für wirtschaftliche Betrachtungen (Nutzungsdauer, Amortisation)
  linear('a', 'Jahr', 365.25 * 86400),
]

const temperatureUnits: Unit[] = [
  { id: 'C', label: '°C', toSI: (v) => v + 273.15, fromSI: (v) => v - 273.15 },
  { id: 'K', label: 'K', toSI: (v) => v, fromSI: (v) => v },
  {
    id: 'F',
    label: '°F',
    toSI: (v) => ((v - 32) * 5) / 9 + 273.15,
    fromSI: (v) => ((v - 273.15) * 9) / 5 + 32,
  },
]

// Temperaturdifferenzen: kein Offset, nur Skalierung (1 K = 1 °C, 1 °F-Differenz = 5/9 K)
const temperatureDeltaUnits: Unit[] = [
  linear('K', 'K', 1),
  linear('C', '°C', 1),
  linear('F', '°F', 5 / 9),
]

const pressureUnits: Unit[] = [
  linear('Pa', 'Pa', 1),
  linear('kPa', 'kPa', 1e3),
  linear('MPa', 'MPa', 1e6),
  linear('mbar', 'mbar', 100),
  linear('bar', 'bar', 1e5),
  linear('psi', 'psi', 6894.757293168),
  // mWS: Druckhöhe von Wasser bei 4 °C (ρ=999,97 kg/m³) unter Normalfallbeschleunigung
  linear('mWS', 'mWS', 999.97 * 9.80665),
  // mmHg: Quecksilbersäule bei 0 °C (ρ=13595,1 kg/m³)
  linear('mmHg', 'mmHg', 13595.1 * 9.80665 * 1e-3),
]

const volumeFlowUnits: Unit[] = [
  linear('m3s', 'm³/s', 1),
  linear('m3h', 'm³/h', 1 / 3600),
  linear('ls', 'l/s', 1e-3),
  linear('lmin', 'l/min', 1e-3 / 60),
  linear('lh', 'l/h', 1e-3 / 3600),
]

const massFlowUnits: Unit[] = [
  linear('kgs', 'kg/s', 1),
  linear('kgh', 'kg/h', 1 / 3600),
  linear('th', 't/h', 1000 / 3600),
]

const densityUnits: Unit[] = [
  linear('kgm3', 'kg/m³', 1),
  linear('gcm3', 'g/cm³', 1000),
]

const dynamicViscosityUnits: Unit[] = [
  linear('Pas', 'Pa·s', 1),
  linear('mPas', 'mPa·s', 1e-3),
  linear('cP', 'cP', 1e-3),
]

const kinematicViscosityUnits: Unit[] = [
  linear('m2s', 'm²/s', 1),
  linear('mm2s', 'mm²/s', 1e-6),
  linear('cSt', 'cSt', 1e-6),
]

const energyUnits: Unit[] = [
  linear('J', 'J', 1),
  linear('kJ', 'kJ', 1e3),
  linear('MJ', 'MJ', 1e6),
  linear('kWh', 'kWh', 3.6e6),
  linear('kcal', 'kcal', 4186.8),
]

const powerUnits: Unit[] = [
  linear('W', 'W', 1),
  linear('kW', 'kW', 1e3),
  linear('MW', 'MW', 1e6),
  linear('PS', 'PS', 735.49875),
]

const specificHeatCapacityUnits: Unit[] = [
  linear('JkgK', 'J/(kg·K)', 1),
  linear('kJkgK', 'kJ/(kg·K)', 1e3),
]

const velocityUnits: Unit[] = [
  linear('ms', 'm/s', 1),
  linear('kmh', 'km/h', 1 / 3.6),
]

const dimensionlessUnits: Unit[] = [linear('_', '-', 1), linear('pct', '%', 0.01)]

const thermalConductivityUnits: Unit[] = [linear('WmK', 'W/(m·K)', 1)]

const heatTransferCoefficientUnits: Unit[] = [linear('Wm2K', 'W/(m²·K)', 1)]

// Wärmedurchlasswiderstand R = s/λ einer Schicht bzw. Summe mehrerer Schichten
const thermalResistanceAreaUnits: Unit[] = [linear('m2KW', 'm²·K/W', 1)]

const specificEnthalpyUnits: Unit[] = [
  linear('Jkg', 'J/kg', 1),
  linear('kJkg', 'kJ/kg', 1e3),
]

const heatFlowPerLengthUnits: Unit[] = [linear('Wm', 'W/m', 1)]

const specificVolumeUnits: Unit[] = [
  linear('m3kg', 'm³/kg', 1),
  linear('lkg', 'l/kg', 1e-3),
]

// Brennwert/Heizwert volumenbezogen, z. B. Erdgas von der Gasrechnung
const calorificValueUnits: Unit[] = [
  linear('Jm3', 'J/m³', 1),
  linear('kWhm3', 'kWh/m³', 3.6e6),
  linear('MJm3', 'MJ/m³', 1e6),
]

// Spezifischer Strombedarf eines Kompressors, bezogen auf den Ansaugvolumenstrom
const compressorSpecificPowerUnits: Unit[] = [
  linear('Wm3s', 'W/(m³/s)', 1),
  // 1 kW je m³/min = 1000 W / (1/60 m³/s) = 60000 W/(m³/s)
  linear('kWm3min', 'kW/(m³/min)', 60000),
]

// CO2-Emissionsfaktor, bezogen auf Energie - keine echte SI-Größe, eigene Basis
const emissionFactorUnits: Unit[] = [
  linear('kgkWh', 'kg CO₂/kWh', 1),
  linear('kgMWh', 'kg CO₂/MWh', 1e-3),
  linear('tMWh', 't CO₂/MWh', 1),
]

const currencyUnits: Unit[] = [linear('EUR', '€', 1)]

const frequencyUnits: Unit[] = [
  linear('Hz', '1/s', 1),
  linear('rpm', '1/min (U/min)', 1 / 60),
]

export const dimensions: Record<DimensionId, Dimension> = {
  length: { id: 'length', label: 'Länge', siUnitLabel: 'm', units: lengthUnits },
  area: { id: 'area', label: 'Fläche', siUnitLabel: 'm²', units: areaUnits },
  volume: { id: 'volume', label: 'Volumen', siUnitLabel: 'm³', units: volumeUnits },
  mass: { id: 'mass', label: 'Masse', siUnitLabel: 'kg', units: massUnits },
  time: { id: 'time', label: 'Zeit', siUnitLabel: 's', units: timeUnits },
  temperature: {
    id: 'temperature',
    label: 'Temperatur',
    siUnitLabel: 'K',
    units: temperatureUnits,
  },
  temperatureDelta: {
    id: 'temperatureDelta',
    label: 'Temperaturdifferenz',
    siUnitLabel: 'K',
    units: temperatureDeltaUnits,
  },
  pressure: { id: 'pressure', label: 'Druck', siUnitLabel: 'Pa', units: pressureUnits },
  volumeFlow: {
    id: 'volumeFlow',
    label: 'Volumenstrom',
    siUnitLabel: 'm³/s',
    units: volumeFlowUnits,
  },
  massFlow: { id: 'massFlow', label: 'Massenstrom', siUnitLabel: 'kg/s', units: massFlowUnits },
  density: { id: 'density', label: 'Dichte', siUnitLabel: 'kg/m³', units: densityUnits },
  dynamicViscosity: {
    id: 'dynamicViscosity',
    label: 'Dynamische Viskosität',
    siUnitLabel: 'Pa·s',
    units: dynamicViscosityUnits,
  },
  kinematicViscosity: {
    id: 'kinematicViscosity',
    label: 'Kinematische Viskosität',
    siUnitLabel: 'm²/s',
    units: kinematicViscosityUnits,
  },
  energy: { id: 'energy', label: 'Energie', siUnitLabel: 'J', units: energyUnits },
  power: { id: 'power', label: 'Leistung', siUnitLabel: 'W', units: powerUnits },
  specificHeatCapacity: {
    id: 'specificHeatCapacity',
    label: 'Spez. Wärmekapazität',
    siUnitLabel: 'J/(kg·K)',
    units: specificHeatCapacityUnits,
  },
  velocity: { id: 'velocity', label: 'Geschwindigkeit', siUnitLabel: 'm/s', units: velocityUnits },
  dimensionless: {
    id: 'dimensionless',
    label: 'Dimensionslos',
    siUnitLabel: '-',
    units: dimensionlessUnits,
  },
  thermalConductivity: {
    id: 'thermalConductivity',
    label: 'Wärmeleitfähigkeit',
    siUnitLabel: 'W/(m·K)',
    units: thermalConductivityUnits,
  },
  heatTransferCoefficient: {
    id: 'heatTransferCoefficient',
    label: 'Wärmeübergangskoeffizient',
    siUnitLabel: 'W/(m²·K)',
    units: heatTransferCoefficientUnits,
  },
  thermalResistanceArea: {
    id: 'thermalResistanceArea',
    label: 'Wärmedurchlasswiderstand',
    siUnitLabel: 'm²·K/W',
    units: thermalResistanceAreaUnits,
  },
  specificEnthalpy: {
    id: 'specificEnthalpy',
    label: 'Spezifische Enthalpie',
    siUnitLabel: 'J/kg',
    units: specificEnthalpyUnits,
  },
  specificVolume: {
    id: 'specificVolume',
    label: 'Spezifisches Volumen',
    siUnitLabel: 'm³/kg',
    units: specificVolumeUnits,
  },
  heatFlowPerLength: {
    id: 'heatFlowPerLength',
    label: 'Wärmestrom je Länge',
    siUnitLabel: 'W/m',
    units: heatFlowPerLengthUnits,
  },
  calorificValue: {
    id: 'calorificValue',
    label: 'Brennwert/Heizwert',
    siUnitLabel: 'J/m³',
    units: calorificValueUnits,
  },
  compressorSpecificPower: {
    id: 'compressorSpecificPower',
    label: 'Spez. Kompressorleistung',
    siUnitLabel: 'W/(m³/s)',
    units: compressorSpecificPowerUnits,
  },
  emissionFactor: {
    id: 'emissionFactor',
    label: 'Emissionsfaktor',
    siUnitLabel: 'kg CO₂/kWh',
    units: emissionFactorUnits,
  },
  currency: {
    id: 'currency',
    label: 'Geld',
    siUnitLabel: '€',
    units: currencyUnits,
  },
  frequency: {
    id: 'frequency',
    label: 'Drehzahl/Frequenz',
    siUnitLabel: '1/s',
    units: frequencyUnits,
  },
}

export function getUnit(dimension: DimensionId, unitId: string): Unit {
  const dim = dimensions[dimension]
  const unit = dim.units.find((u) => u.id === unitId)
  if (!unit) {
    throw new Error(`Unbekannte Einheit "${unitId}" für Dimension "${dimension}"`)
  }
  return unit
}

export function toSI(value: number, dimension: DimensionId, unitId: string): number {
  return getUnit(dimension, unitId).toSI(value)
}

export function fromSI(value: number, dimension: DimensionId, unitId: string): number {
  return getUnit(dimension, unitId).fromSI(value)
}

/** ν = η / ρ: dynamische Viskosität (Pa·s) + Dichte (kg/m³) -> kinematische Viskosität (m²/s) */
export function dynamicToKinematic(etaPas: number, rhoKgM3: number): number {
  if (rhoKgM3 <= 0) throw new Error('Dichte muss größer 0 sein')
  return etaPas / rhoKgM3
}

/** η = ν · ρ: kinematische Viskosität (m²/s) + Dichte (kg/m³) -> dynamische Viskosität (Pa·s) */
export function kinematicToDynamic(nuM2s: number, rhoKgM3: number): number {
  return nuM2s * rhoKgM3
}

export const NORMDRUCK_PA = 101325

export const G = 9.80665
