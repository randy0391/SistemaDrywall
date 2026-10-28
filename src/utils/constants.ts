import type { MaterialPrices } from '../types';

export const DEFAULT_PRICES: MaterialPrices = {
  planchaDrywall12mm: 28.00,
  planchaDrywall15mm: 35.00,
  paranteMetalico89mm: 12.50,
  rielMetalico89mm: 11.00,
  paranteMetalico64mm: 10.50,
  rielMetalico64mm: 9.50,
  tornilloDrywall1inch: 0.05,
  tornilloWafer: 0.08,
  cintaPapel: 8.00,
  cintaMalla: 12.00,
  masilla: 35.00,
  esquinero: 8.50,
  fulminante: 0.80,
  clavo: 0.15,
};

// Drywall sheet standard size (in meters)
export const SHEET_WIDTH = 1.22; // 4 feet
export const SHEET_HEIGHT = 2.44; // 8 feet
export const SHEET_AREA = SHEET_WIDTH * SHEET_HEIGHT; // 2.9768 m²

// Stud spacing
export const STUD_SPACING = 0.406; // 16 inches = 0.406m (center to center)
export const STUD_SPACING_CEILING = 0.61; // 24 inches for ceilings

// Screw counts
export const SCREWS_PER_SHEET = 32;
export const WAFER_SCREWS_PER_STUD = 4;

// Joint tape per sheet (approx)
export const TAPE_PER_SHEET = 3.5; // meters

// Compound per m²
export const COMPOUND_PER_SQM = 0.5; // kg per m²

// Waste factor
export const WASTE_FACTOR = 1.10; // 10% waste

export const CONSTRUCTION_TYPES = [
  { value: 'tabique', label: 'Tabique Divisorio', icon: '🧱', description: 'Pared divisoria interior' },
  { value: 'cieloraso', label: 'Cielo Raso', icon: '⬆️', description: 'Falso techo suspendido' },
  { value: 'revestimiento', label: 'Revestimiento', icon: '🏗️', description: 'Recubrimiento de muro existente' },
  { value: 'nicho', label: 'Nicho / Detalle', icon: '🖼️', description: 'Nicho decorativo o detalle arquitectónico' },
  { value: 'mueble', label: 'Mueble en Drywall', icon: '🗄️', description: 'Mueble empotrado o decorativo' },
] as const;

export const PROJECT_STATUSES = [
  { value: 'borrador', label: 'Borrador', color: 'gray' },
  { value: 'cotizado', label: 'Cotizado', color: 'blue' },
  { value: 'aprobado', label: 'Aprobado', color: 'green' },
  { value: 'en_proceso', label: 'En Proceso', color: 'yellow' },
  { value: 'completado', label: 'Completado', color: 'emerald' },
] as const;
