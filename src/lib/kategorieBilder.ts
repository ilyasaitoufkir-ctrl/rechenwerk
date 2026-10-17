/**
 * Ordnet jede Formel-Kategorie ihrem Kategoriefoto zu (siehe CREDITS.md und
 * public/images/kategorien/). Eine Stelle für alle Seiten, die Kategoriebilder
 * zeigen (Rechner, KategorieDetail, Calculator).
 */
export const KATEGORIE_BILD: Record<string, string> = {
  'Strömung & Rohrleitungen': 'stroemung',
  Wärmeübertragung: 'waerme',
  'Dampf (IAPWS-IF97)': 'dampf',
  Pumpen: 'pumpen',
  'Dosierung & Mischen': 'dosierung-mischen',
  'Behälter & Geometrie': 'behaelter',
  Druckgeräte: 'druckgeraete',
  Sicherheitsventile: 'sicherheitsventile',
  Rektifikation: 'rektifikation',
  'Energie & Kosten': 'energie-kosten',
}
