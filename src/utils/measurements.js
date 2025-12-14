import { UNITS } from '../constants/printSettings';

// Convierte un valor en milímetros a la unidad seleccionada (mm, cm, in) con decimales formateados
export const convert = (valMm, unit) => {
  if (!UNITS[unit]) return valMm;
  return (valMm * UNITS[unit].factor).toFixed(UNITS[unit].decimals);
};

// Convierte un valor de la unidad seleccionada (mm, cm, in) a milímetros puros
export const toMm = (val, unit) => {
  if (!UNITS[unit]) return val;
  return val / UNITS[unit].factor;
};

// Convierte milímetros a píxeles (basado en 96 DPI estándar de pantalla: 1mm ≈ 3.78px)
export const mmToPx = (mm) => mm * 3.7795275591;