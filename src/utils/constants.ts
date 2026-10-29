import type {
  MaterialPrices,
  LaborCosts,
  BoardType,
  InsulationType,
  CrewSize,
  ElectricalPointType,
} from '../types';

export const DEFAULT_PRICES: MaterialPrices = {
  // Drywall
  planchaDrywall12mm: 28.00,
  planchaDrywall15mm: 35.00,
  planchaDrywallRH: 38.00,
  planchaDrywallRF: 44.00,
  planchaSuperboard6mm: 46.00,
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
  lanaFibraVidrio50mm: 115.00,
  lanaRocaPaquete: 165.00,
  perfilLedAluminio: 22.00,
  tiraLedMetro: 12.00,
  selladorDrywallGalon: 32.00,
  pinturaLatexGalon: 48.00,
  lijaAguaPliego: 2.50,

  // Materiales Eléctricos Monofásicos (220V)
  cable14AWGMetro: 1.60,           // S/ 1.60 m (circuito alumbrado / retornos)
  cable12AWGMetro: 2.40,           // S/ 2.40 m (circuito tomacorrientes)
  cable10AWGMetro: 3.80,           // S/ 3.80 m (cargas especiales / terma monofásica)
  tuboCorrugado12Metro: 1.20,      // S/ 1.20 m (para alumbrado)
  tuboCorrugado34Metro: 1.80,      // S/ 1.80 m (para tomacorrientes y fuerza)
  cajaRectangular4x2: 3.50,        // S/ 3.50 und (para empotrar en drywall o muro)
  cajaOctogonal: 4.00,             // S/ 4.00 und (para centros de luz en techo)
  placaTomacorrienteDoble: 14.00,   // S/ 14.00 und (placa + 2 dados 2P+T con tierra)
  placaInterruptorSimple: 11.00,    // S/ 11.00 und (placa + 1 dado)
  placaInterruptorConmutado: 18.00, // S/ 18.00 und (placa + dado 3-way conmutación)
  spotLedEmpotrable: 16.00,         // S/ 16.00 und (spot LED 7W-12W con driver)
  llaveTermomagnetica2P: 32.00,     // S/ 32.00 und (termomagnética monofásica 2 polos)
  llaveDiferencial2P: 75.00,        // S/ 75.00 und (diferencial de seguridad humana 2x25A)
  gabineteTableroMonofasico: 38.00, // S/ 38.00 und (caja tablero 4-8 polos monofásico)
  cintaAislante: 6.50,              // S/ 6.50 rollo (3M / Temflex)
};

export const DEFAULT_LABOR_COSTS: LaborCosts = {
  // Drywall
  costPerSqmTabiqueSimple: 25.00,  // S/ 25 por m² de tabique una cara
  costPerSqmTabiqueDoble: 35.00,   // S/ 35 por m² de tabique doble cara
  costPerSqmCieloRaso: 30.00,      // S/ 30 por m² de cielo raso
  costPerSqmAcabado: 12.00,        // S/ 12 por m² de encintado y masillado
  costPerSqmPintura: 8.00,         // S/ 8 por m² de pintura a 2 manos
  includeLabor: true,              // Habilitado por defecto
  profitMarginPercent: 10,         // 10% imprevistos / utilidad

  // Electricidad Monofásica (Mano de obra por punto)
  costPerPointTomacorriente: 40.00,  // S/ 40 por punto de tomacorriente
  costPerPointLuzSimple: 35.00,      // S/ 35 por punto de luz simple
  costPerPointConmutado: 65.00,      // S/ 65 por conmutación completa (2 interruptores + centro)
  costPerPointDicroico: 30.00,       // S/ 30 por spot / dicroico empotrado
  costPerTableroMonofasico: 100.00,  // S/ 100 por tablero monofásico
  costPerPointFuerza: 60.00,         // S/ 60 por punto de terma o cocina monofásica
};

// Drywall sheet standard size (in meters)
export const SHEET_WIDTH = 1.22;
export const SHEET_HEIGHT = 2.44;
export const SHEET_AREA = SHEET_WIDTH * SHEET_HEIGHT;

// Stud spacing
export const STUD_SPACING = 0.406;
export const STUD_SPACING_CEILING = 0.61;

// Screw counts
export const SCREWS_PER_SHEET = 32;
export const WAFER_SCREWS_PER_STUD = 4;

// Joint tape per sheet
export const TAPE_PER_SHEET = 3.5;
export const COMPOUND_PER_SQM = 0.5;
export const WASTE_FACTOR = 1.10;

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

// Configuración de Trabajos Eléctricos Exclusivamente Monofásicos
export const ELECTRICAL_POINT_CONFIGS: Record<
  ElectricalPointType,
  {
    name: string;
    label: string;
    icon: string;
    wireType: 'cable14AWG' | 'cable12AWG' | 'cable10AWG';
    wireMetersPerPoint: number;
    conduitMetersPerPoint: number;
    conduitType: '1/2' | '3/4';
    boxesPerPoint: { rect4x2: number; octo: number };
    description: string;
  }
> = {
  tomacorriente_doble: {
    name: 'Tomacorriente Doble con Tierra (2P+T)',
    label: 'Tomacorriente Doble',
    icon: '🔌',
    wireType: 'cable12AWG',
    wireMetersPerPoint: 15, // 3 conductores x 5m (Fase, Neutro, Tierra)
    conduitMetersPerPoint: 5,
    conduitType: '3/4',
    boxesPerPoint: { rect4x2: 1, octo: 0 },
    description: 'Placa doble con puesta a tierra para electrodomésticos y equipos.',
  },
  tomacorriente_simple: {
    name: 'Tomacorriente Simple 2P+T',
    label: 'Tomacorriente Simple',
    icon: '🔌',
    wireType: 'cable12AWG',
    wireMetersPerPoint: 12,
    conduitMetersPerPoint: 4,
    conduitType: '3/4',
    boxesPerPoint: { rect4x2: 1, octo: 0 },
    description: 'Toma simple monofásica 220V.',
  },
  tomacorriente_intemperie: {
    name: 'Tomacorriente para Intemperie (con tapa estanca)',
    label: 'Toma Intemperie / Baño',
    icon: '🛡️',
    wireType: 'cable12AWG',
    wireMetersPerPoint: 15,
    conduitMetersPerPoint: 5,
    conduitType: '3/4',
    boxesPerPoint: { rect4x2: 1, octo: 0 },
    description: 'Con protección contra salpicaduras para patios o baños.',
  },
  luz_simple: {
    name: 'Punto de Luz Simple (Interruptor + Centro)',
    label: 'Luz Simple',
    icon: '💡',
    wireType: 'cable14AWG',
    wireMetersPerPoint: 10, // Fase, neutro y retorno x ~3.5m
    conduitMetersPerPoint: 4,
    conduitType: '1/2',
    boxesPerPoint: { rect4x2: 1, octo: 1 },
    description: '1 interruptor simple que controla 1 centro de luz o aplique.',
  },
  luz_conmutada: {
    name: 'Punto Conmutado (Escalera / 3-Way - 2 Controles)',
    label: 'Conmutado / Escalera',
    icon: '🔄',
    wireType: 'cable14AWG',
    wireMetersPerPoint: 24, // 3 conductores entre interruptores + centro
    conduitMetersPerPoint: 8,
    conduitType: '1/2',
    boxesPerPoint: { rect4x2: 2, octo: 1 },
    description: 'Se enciende y apaga desde 2 lugares distintos (cabecera/entrada, escalera).',
  },
  luz_dicroico: {
    name: 'Spot / Dicroico LED en Falso Techo',
    label: 'Spot / Dicroico LED',
    icon: '✨',
    wireType: 'cable14AWG',
    wireMetersPerPoint: 6,
    conduitMetersPerPoint: 3,
    conduitType: '1/2',
    boxesPerPoint: { rect4x2: 0, octo: 1 },
    description: 'Spot LED empotrado en cielo raso de drywall.',
  },
  tablero_monofasico: {
    name: 'Tablero de Distribución Monofásico',
    label: 'Tablero Monofásico',
    icon: '⚡',
    wireType: 'cable10AWG',
    wireMetersPerPoint: 12,
    conduitMetersPerPoint: 4,
    conduitType: '3/4',
    boxesPerPoint: { rect4x2: 0, octo: 0 },
    description: 'Gabinete con llave general, térmicas para alumbrado/tomacorrientes y diferencial.',
  },
  salida_fuerza_monofasica: {
    name: 'Salida de Fuerza Monofásica (Terma / Cocina 220V)',
    label: 'Fuerza (Terma/Cocina)',
    icon: '🚿',
    wireType: 'cable10AWG',
    wireMetersPerPoint: 18,
    conduitMetersPerPoint: 6,
    conduitType: '3/4',
    boxesPerPoint: { rect4x2: 1, octo: 0 },
    description: 'Circuito independiente monofásico con cable #10 para alta demanda.',
  },
};

export const PROJECT_STATUSES = [
  { value: 'borrador', label: 'Borrador', color: 'gray' },
  { value: 'cotizado', label: 'Cotizado', color: 'blue' },
  { value: 'aprobado', label: 'Aprobado', color: 'green' },
  { value: 'en_proceso', label: 'En Proceso', color: 'yellow' },
  { value: 'completado', label: 'Completado', color: 'emerald' },
] as const;
