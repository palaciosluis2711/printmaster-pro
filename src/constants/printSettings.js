// Definición de tamaños de papel estándar en milímetros
export const PAGE_SIZES = {
  carta: { name: 'Carta (Letter)', width: 215.9, height: 279.4 },
  oficio: { name: 'Oficio (Legal)', width: 215.9, height: 355.6 },
  a4: { name: 'A4', width: 210, height: 297 },
  tabloide: { name: 'Tabloide (11x17)', width: 279.4, height: 431.8 },
  fotografia: { name: '4x6" (10x15cm)', width: 101.6, height: 152.4 }
};

// Configuración de unidades de medida (factores de conversión respecto a mm)
export const UNITS = {
  mm: { label: 'mm', factor: 1, step: 1, decimals: 0 },
  cm: { label: 'cm', factor: 0.1, step: 0.1, decimals: 1 },
  in: { label: 'in', factor: 0.0393701, step: 0.05, decimals: 2 }
};