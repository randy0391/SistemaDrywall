import type { MaterialPrices, LaborCosts, BoardType, InsulationType, CrewSize } from '../types';

export const DEFAULT_PRICES: MaterialPrices = {
  planchaDrywall12mm: 28.00,
  planchaDrywall15mm: 35.00,
  planchaDrywallRH: 38.00,       // Verde resistente a la humedad
  planchaDrywallRF: 44.00,       // Rosada cortafuego
  planchaSuperboard6mm: 46.00,   // Placa fibrocemento exterior
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
  // Nuevos materiales
  lanaFibraVidrio50mm: 115.00,   // Rollo de 14.4 m²
  lanaRocaPaquete: 165.00,       // Paquete de 7.2 m²
  perfilLedAluminio: 22.00,      // Perfil de 2m con difusor opalino
  tiraLedMetro: 12.00,           // Metro lineal tira LED alta densidad
  selladorDrywallGalon: 32.00,   // Galón sellador/imprimante (rinde ~35 m²)
  pinturaLatexGalon: 48.00,      // Galón pintura látex lavable (rinde ~30 m² a 2 manos)
  lijaAguaPliego: 2.50,          // Pliego de lija de agua gr. 120 / 180
};

export const DEFAULT_LABOR_COSTS: LaborCosts = {
  costPerSqmTabiqueSimple: 25.00,  // S/ 25 por m² de tabique una cara
  costPerSqmTabiqueDoble: 35.00,   // S/ 35 por m² de tabique doble cara
  costPerSqmCieloRaso: 30.00,      // S/ 30 por m² de cielo raso
  costPerSqmAcabado: 12.00,        // S/ 12 por m² de encintado y masillado
  costPerSqmPintura: 8.00,         // S/ 8 por m² de pintura a 2 manos
  includeLabor: true,              // Habilitado por defecto
  profitMarginPercent: 10,         // 10% imprevistos / utilidad
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
  { value: 'nicho', label: 'Nicho / Mueble TV', icon: '📺', description: 'Centro de entretenimiento o nicho con luz' },
  { value: 'mueble', label: 'Mueble en Drywall', icon: '🗄️', description: 'Mueble empotrado o repisas' },
] as const;

export const BOARD_TYPES: Record<BoardType, { name: string; label: string; badge: string; color: string; hex3d: number }> = {
  ST: {
    name: 'ST Standard (Gris / Blanca)',
    label: 'ST Standard',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    color: '#f5f3ef',
    hex3d: 0xf3efe6,
  },
  RH: {
    name: 'RH Resistente a Humedad (Verde)',
    label: 'RH Verde (Baños/Cocina)',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: '#a7f3d0',
    hex3d: 0x86efac,
  },
  RF: {
    name: 'RF Resistente al Fuego (Rosada)',
    label: 'RF Cortafuego',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    color: '#fecdd3',
    hex3d: 0xfda4af,
  },
  Superboard: {
    name: 'Superboard Fibrocemento (Exteriores)',
    label: 'Superboard 6mm',
    badge: 'bg-zinc-200 text-zinc-800 border-zinc-400',
    color: '#cbd5e1',
    hex3d: 0x94a3b8,
  },
};

export const INSULATION_TYPES: Record<InsulationType, { name: string; label: string; rollArea: number; icon: string }> = {
  ninguno: {
    name: 'Sin aislamiento termoacústico',
    label: 'Sin aislamiento',
    rollArea: 0,
    icon: '⚪',
  },
  fibra_vidrio: {
    name: 'Lana de Fibra de Vidrio 50mm (rollo 14.4m²)',
    label: 'Lana Fibra de Vidrio 50mm',
    rollArea: 14.4,
    icon: '🟡',
  },
  lana_roca: {
    name: 'Lana de Roca Alta Densidad (paquete 7.2m²)',
    label: 'Lana de Roca Acústica',
    rollArea: 7.2,
    icon: '🟤',
  },
};

export const CREW_CONFIGS: Record<CrewSize, { label: string; factor: number; description: string }> = {
  '1_maestro': {
    label: '1 Maestro Solista',
    factor: 0.5,
    description: 'Rendimiento ~12 m²/día. Ideal para remodelaciones pequeñas o trabajos detallistas.',
  },
  '1_maestro_1_ayudante': {
    label: '1 Maestro + 1 Ayudante (Cuadrilla Estándar)',
    factor: 1.0,
    description: 'Rendimiento ~25 m²/día. El equipo estándar y más eficiente en costos.',
  },
  '2_maestros_2_ayudantes': {
    label: '2 Maestros + 2 Ayudantes (Equipo Rápido)',
    factor: 2.0,
    description: 'Rendimiento ~50 m²/día. Para entregas de obra rápida o metrados grandes.',
  },
};

export const PROJECT_STATUSES = [
  { value: 'borrador', label: 'Borrador', color: 'gray' },
  { value: 'cotizado', label: 'Cotizado', color: 'blue' },
  { value: 'aprobado', label: 'Aprobado', color: 'green' },
  { value: 'en_proceso', label: 'En Proceso', color: 'yellow' },
  { value: 'completado', label: 'Completado', color: 'emerald' },
] as const;
