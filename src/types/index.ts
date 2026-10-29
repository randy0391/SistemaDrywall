// Material types
export type MaterialUnit = 'unidad' | 'metro' | 'kg' | 'galón' | 'rollo' | 'bolsa' | 'caja' | 'pliego' | 'paquete';

export type ConstructionType = 'tabique' | 'cieloraso' | 'revestimiento' | 'nicho' | 'mueble';

export type BoardType = 'ST' | 'RH' | 'RF' | 'Superboard';

export type InsulationType = 'ninguno' | 'fibra_vidrio' | 'lana_roca';

export type CrewSize = '1_maestro' | '1_maestro_1_ayudante' | '2_maestros_2_ayudantes';

// Tipos de proyectos
export type ProjectType = 'drywall' | 'electrico' | 'mixto';

// Tipos de trabajos eléctricos exclusivamente MONOFÁSICOS (220V)
export type ElectricalPointType =
  | 'tomacorriente_doble'
  | 'tomacorriente_simple'
  | 'tomacorriente_intemperie'
  | 'luz_simple'
  | 'luz_conmutada'
  | 'luz_dicroico'
  | 'tablero_monofasico'
  | 'salida_fuerza_monofasica';

export interface ElectricalItem {
  id: string;
  name: string;
  type: ElectricalPointType;
  quantity: number;
  location?: string; // ej: "Sala", "Dormitorio", "Cocina"
  notes?: string;
}

export interface Material {
  id: string;
  name: string;
  unit: MaterialUnit;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: 'estructura' | 'plancha' | 'acabado' | 'fijacion' | 'aislamiento' | 'iluminacion' | 'pintura' | 'electrico';
  description?: string;
}

export interface WallMeasurement {
  id: string;
  name: string;
  width: number;  // metros
  height: number; // metros
  type: ConstructionType;
  hasDoubleSide: boolean; // doble cara
  boardType?: BoardType;
  insulation?: InsulationType;
  hasLightNiche?: boolean;
  openings: Opening[];
}

export interface Opening {
  id: string;
  type: 'puerta' | 'ventana';
  width: number;
  height: number;
}

export interface CeilingMeasurement {
  id: string;
  name: string;
  width: number;
  length: number;
  dropHeight: number; // altura de descuelgue
  boardType?: BoardType;
  insulation?: InsulationType;
  hasLedCove?: boolean; // garganta perimetral luz LED
  covePerimeterMeters?: number;
}

export interface LaborCosts {
  // Drywall
  costPerSqmTabiqueSimple: number; // S/ por m² (ej. 25.00)
  costPerSqmTabiqueDoble: number;  // S/ por m² (ej. 35.00)
  costPerSqmCieloRaso: number;     // S/ por m² (ej. 30.00)
  costPerSqmAcabado: number;       // S/ por m² masillado/encintado (ej. 12.00)
  costPerSqmPintura: number;       // S/ por m² pintura 2 manos (ej. 8.00)
  includeLabor: boolean;           // si se suma al presupuesto
  profitMarginPercent: number;     // % utilidad / imprevistos (ej. 10%)

  // Electricidad Monofásica (Tarifas por punto instalado)
  costPerPointTomacorriente: number;     // S/ por punto (ej. 40.00)
  costPerPointLuzSimple: number;         // S/ por punto (ej. 35.00)
  costPerPointConmutado: number;         // S/ por conmutado completo (ej. 65.00)
  costPerPointDicroico: number;          // S/ por spot empotrado (ej. 30.00)
  costPerTableroMonofasico: number;      // S/ instalación y peinado de tablero (ej. 100.00)
  costPerPointFuerza: number;            // S/ terma o cocina monofásica (ej. 60.00)
}

export interface WorkSchedule {
  structureDays: number;
  sheetingDays: number;
  muddingDays: number;
  paintingDays: number;
  totalDays: number;
  crewDescription: string;
  estimatedCompletionDate: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  date: string;
  description: string;
  projectType?: ProjectType; // 'drywall' | 'electrico' | 'mixto'
  linkedProjectId?: string;  // ID del proyecto vinculado si se asocian

  // Drywall measurements & materials
  walls: WallMeasurement[];
  ceilings: CeilingMeasurement[];
  materials: Material[];
  materialsCost: number;
  laborCost: number;
  profitAmount: number;
  totalCost: number;
  includePaintFinishing?: boolean;
  crewSize?: CrewSize;

  // Electrical items & calculations (Monofásico - 100% Separado)
  electricalItems?: ElectricalItem[];
  electricalMaterials?: Material[];
  electricalMaterialsCost?: number;
  electricalLaborCost?: number;
  electricalTotalCost?: number;

  syncCode?: string;
  laborSettings?: LaborCosts;
  sketchImage?: string; // base64 de la foto del dibujo
  status: 'borrador' | 'cotizado' | 'aprobado' | 'en_proceso' | 'completado';
  createdAt: string;
  updatedAt: string;
}

export interface MaterialPrices {
  // Drywall
  planchaDrywall12mm: number;
  planchaDrywall15mm: number;
  planchaDrywallRH: number;
  planchaDrywallRF: number;
  planchaSuperboard6mm: number;
  paranteMetalico89mm: number;
  rielMetalico89mm: number;
  paranteMetalico64mm: number;
  rielMetalico64mm: number;
  tornilloDrywall1inch: number;
  tornilloWafer: number;
  cintaPapel: number;
  cintaMalla: number;
  masilla: number;
  esquinero: number;
  fulminante: number;
  clavo: number;
  lanaFibraVidrio50mm: number;
  lanaRocaPaquete: number;
  perfilLedAluminio: number;
  tiraLedMetro: number;
  selladorDrywallGalon: number;
  pinturaLatexGalon: number;
  lijaAguaPliego: number;

  // Materiales Eléctricos Monofásicos
  cable14AWGMetro: number;          // Cable libre de halógenos/TW 2.5mm² (#14) por metro
  cable12AWGMetro: number;          // Cable libre de halógenos/TW 4mm² (#12) por metro
  cable10AWGMetro: number;          // Cable libre de halógenos/TW 6mm² (#10) por metro
  tuboCorrugado12Metro: number;     // Tubo corrugado flexible naranja 1/2" por metro
  tuboCorrugado34Metro: number;     // Tubo corrugado flexible naranja 3/4" por metro
  cajaRectangular4x2: number;       // Caja pesada o liviana 4x2
  cajaOctogonal: number;            // Caja octogonal para centro de luz
  placaTomacorrienteDoble: number;  // Placa + 2 dados tomacorriente con tierra (2P+T)
  placaInterruptorSimple: number;   // Placa + 1 dado interruptor simple
  placaInterruptorConmutado: number;// Placa + dado de conmutación 3 vías (escalera)
  spotLedEmpotrable: number;        // Spot / Dicroico LED empotrable 7W/9W/12W
  llaveTermomagnetica2P: number;    // Termomagnética monofásica 2x16A, 2x20A, 2x25A
  llaveDiferencial2P: number;       // Interruptor Diferencial 2x25A o 2x40A 30mA
  gabineteTableroMonofasico: number;// Gabinete para tablero 4 a 8 polos
  cintaAislante: number;            // Cinta aislante 3M / Temflex rollo
}

// 3D Scene types
export interface Wall3D {
  id: string;
  position: [number, number, number];
  dimensions: [number, number, number];
  rotation: [number, number, number];
  color: string;
  showStructure: boolean;
}

export interface Scene3D {
  walls: Wall3D[];
  ceilings: Wall3D[];
  showGrid: boolean;
  showDimensions: boolean;
  viewMode: 'acabado' | 'estructura' | 'wireframe';
}

// AI Sketch Detection Result
export interface DetectedSketch {
  projectName?: string;
  walls: WallMeasurement[];
  ceilings: CeilingMeasurement[];
  notes?: string;
}
