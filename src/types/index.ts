// Material types
export type MaterialUnit = 'unidad' | 'metro' | 'kg' | 'galón' | 'rollo' | 'bolsa' | 'caja';

export type ConstructionType = 'tabique' | 'cieloraso' | 'revestimiento' | 'nicho' | 'mueble';

export interface Material {
  id: string;
  name: string;
  unit: MaterialUnit;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: 'estructura' | 'plancha' | 'acabado' | 'fijacion';
  description?: string;
}

export interface WallMeasurement {
  id: string;
  name: string;
  width: number;  // metros
  height: number; // metros
  type: ConstructionType;
  hasDoubleSide: boolean; // doble cara
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
}

export interface LaborCosts {
  costPerSqmTabiqueSimple: number; // S/ por m² (ej. 25.00)
  costPerSqmTabiqueDoble: number;  // S/ por m² (ej. 35.00)
  costPerSqmCieloRaso: number;     // S/ por m² (ej. 30.00)
  costPerSqmAcabado: number;       // S/ por m² masillado/encintado (ej. 12.00)
  includeLabor: boolean;           // si se suma al presupuesto
  profitMarginPercent: number;     // % utilidad / imprevistos (ej. 10%)
}

export interface Project {
  id: string;
  name: string;
  client: string;
  date: string;
  description: string;
  walls: WallMeasurement[];
  ceilings: CeilingMeasurement[];
  materials: Material[];
  materialsCost: number;
  laborCost: number;
  profitAmount: number;
  totalCost: number;
  laborSettings?: LaborCosts;
  sketchImage?: string; // base64 de la foto del dibujo
  status: 'borrador' | 'cotizado' | 'aprobado' | 'en_proceso' | 'completado';
  createdAt: string;
  updatedAt: string;
}

export interface MaterialPrices {
  planchaDrywall12mm: number;
  planchaDrywall15mm: number;
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
