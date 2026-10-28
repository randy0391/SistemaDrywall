import type { Material, WallMeasurement, CeilingMeasurement, Opening, MaterialPrices, LaborCosts } from '../types';
import {
  SHEET_WIDTH,
  SHEET_HEIGHT,
  SHEET_AREA,
  STUD_SPACING,
  STUD_SPACING_CEILING,
  SCREWS_PER_SHEET,
  WAFER_SCREWS_PER_STUD,
  TAPE_PER_SHEET,
  COMPOUND_PER_SQM,
  WASTE_FACTOR,
} from './constants';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function calculateOpeningsArea(openings: Opening[]): number {
  return openings.reduce((total, op) => total + op.width * op.height, 0);
}

export function calculateWallMaterials(wall: WallMeasurement, prices: MaterialPrices): Material[] {
  const grossArea = wall.width * wall.height;
  const openingsArea = calculateOpeningsArea(wall.openings);
  const netArea = grossArea - openingsArea;
  const sides = wall.hasDoubleSide ? 2 : 1;
  const drywallArea = netArea * sides;

  // Sheets
  const sheetsRaw = drywallArea / SHEET_AREA;
  const sheets = Math.ceil(sheetsRaw * WASTE_FACTOR);

  // Studs: one every STUD_SPACING along the width, plus 1 at each end
  const studsCount = Math.ceil(wall.width / STUD_SPACING) + 1;

  // Tracks: top + bottom — tracks come in 3.05m lengths (10ft)
  const trackMeters = wall.width * 2; // top + bottom
  const trackPieces = Math.ceil(trackMeters / 3.05);

  // Door/window framing extra studs
  const extraStuds = wall.openings.length * 4; // 2 jack studs + 2 king studs per opening

  // Headers for openings
  const headerPieces = wall.openings.length * 2;

  // Drywall screws
  const drywallScrews = sheets * SCREWS_PER_SHEET;

  // Wafer screws (for metal structure)
  const waferScrews = (studsCount + extraStuds) * WAFER_SCREWS_PER_STUD;

  // Joint tape
  const tapeMeters = Math.ceil(sheets * TAPE_PER_SHEET);

  // Joint compound (masilla)
  const compoundKg = Math.ceil(drywallArea * COMPOUND_PER_SQM);
  const compoundBags = Math.ceil(compoundKg / 28); // 28kg bags

  // Corner beads (esquineros) - for external corners only
  const cornerBeadMeters = wall.openings.reduce((total, op) => {
    if (op.type === 'puerta') return total + op.height * 2;
    return total + (op.width * 2 + op.height * 2);
  }, 0);
  const cornerBeadPieces = Math.ceil(cornerBeadMeters / 2.44); // 2.44m pieces

  const materials: Material[] = [
    {
      id: generateId(),
      name: 'Plancha Drywall 1/2" (12.7mm)',
      unit: 'unidad',
      quantity: sheets,
      unitPrice: prices.planchaDrywall12mm,
      totalPrice: sheets * prices.planchaDrywall12mm,
      category: 'plancha',
      description: `${SHEET_WIDTH}m × ${SHEET_HEIGHT}m (4'×8')`,
    },
    {
      id: generateId(),
      name: 'Parante Metálico 89mm × 3.05m',
      unit: 'unidad',
      quantity: studsCount + extraStuds,
      unitPrice: prices.paranteMetalico89mm,
      totalPrice: (studsCount + extraStuds) * prices.paranteMetalico89mm,
      category: 'estructura',
      description: 'Separación cada 0.406m (16")',
    },
    {
      id: generateId(),
      name: 'Riel Metálico 89mm × 3.05m',
      unit: 'unidad',
      quantity: trackPieces + headerPieces,
      unitPrice: prices.rielMetalico89mm,
      totalPrice: (trackPieces + headerPieces) * prices.rielMetalico89mm,
      category: 'estructura',
      description: 'Superior e inferior',
    },
    {
      id: generateId(),
      name: 'Tornillo Drywall 1"',
      unit: 'unidad',
      quantity: drywallScrews,
      unitPrice: prices.tornilloDrywall1inch,
      totalPrice: drywallScrews * prices.tornilloDrywall1inch,
      category: 'fijacion',
      description: 'Para fijar planchas a estructura',
    },
    {
      id: generateId(),
      name: 'Tornillo Wafer',
      unit: 'unidad',
      quantity: waferScrews,
      unitPrice: prices.tornilloWafer,
      totalPrice: waferScrews * prices.tornilloWafer,
      category: 'fijacion',
      description: 'Para unir estructura metálica',
    },
    {
      id: generateId(),
      name: 'Cinta para Juntas (rollo 75m)',
      unit: 'rollo',
      quantity: Math.ceil(tapeMeters / 75),
      unitPrice: prices.cintaPapel,
      totalPrice: Math.ceil(tapeMeters / 75) * prices.cintaPapel,
      category: 'acabado',
    },
    {
      id: generateId(),
      name: 'Masilla para Juntas (bolsa 28kg)',
      unit: 'bolsa',
      quantity: compoundBags,
      unitPrice: prices.masilla,
      totalPrice: compoundBags * prices.masilla,
      category: 'acabado',
    },
  ];

  if (cornerBeadPieces > 0) {
    materials.push({
      id: generateId(),
      name: 'Esquinero Metálico 2.44m',
      unit: 'unidad',
      quantity: cornerBeadPieces,
      unitPrice: prices.esquinero,
      totalPrice: cornerBeadPieces * prices.esquinero,
      category: 'acabado',
    });
  }

  return materials;
}

export function calculateCeilingMaterials(ceiling: CeilingMeasurement, prices: MaterialPrices): Material[] {
  const area = ceiling.width * ceiling.length;

  // Sheets
  const sheetsRaw = area / SHEET_AREA;
  const sheets = Math.ceil(sheetsRaw * WASTE_FACTOR);

  // Main channels (omegas/furring) - every 0.61m along width
  const mainChannelCount = Math.ceil(ceiling.width / STUD_SPACING_CEILING) + 1;
  const mainChannelPieces = mainChannelCount * Math.ceil(ceiling.length / 3.05);

  // Perimeter track
  const perimeterMeters = (ceiling.width + ceiling.length) * 2;
  const perimeterPieces = Math.ceil(perimeterMeters / 3.05);

  // Hangers (colgadores/varillas roscadas) - one every 1.2m along each channel
  const hangersPerChannel = Math.ceil(ceiling.length / 1.2);
  const totalHangers = mainChannelCount * hangersPerChannel;

  // Screws
  const drywallScrews = sheets * SCREWS_PER_SHEET;

  // Tape and compound
  const tapeMeters = Math.ceil(sheets * TAPE_PER_SHEET);
  const compoundKg = Math.ceil(area * COMPOUND_PER_SQM);

  // Fulminantes for hanging
  const fulminantes = totalHangers;

  const materials: Material[] = [
    {
      id: generateId(),
      name: 'Plancha Drywall 1/2" (12.7mm)',
      unit: 'unidad',
      quantity: sheets,
      unitPrice: prices.planchaDrywall12mm,
      totalPrice: sheets * prices.planchaDrywall12mm,
      category: 'plancha',
    },
    {
      id: generateId(),
      name: 'Parante/Omega Cielo Raso × 3.05m',
      unit: 'unidad',
      quantity: mainChannelPieces,
      unitPrice: prices.paranteMetalico64mm,
      totalPrice: mainChannelPieces * prices.paranteMetalico64mm,
      category: 'estructura',
      description: 'Canales principales cada 0.61m',
    },
    {
      id: generateId(),
      name: 'Riel Perimetral 64mm × 3.05m',
      unit: 'unidad',
      quantity: perimeterPieces,
      unitPrice: prices.rielMetalico64mm,
      totalPrice: perimeterPieces * prices.rielMetalico64mm,
      category: 'estructura',
      description: 'Ángulo perimetral',
    },
    {
      id: generateId(),
      name: 'Varilla Roscada 3/8" (colgador)',
      unit: 'unidad',
      quantity: totalHangers,
      unitPrice: 3.50,
      totalPrice: totalHangers * 3.50,
      category: 'estructura',
      description: `Largo: ${ceiling.dropHeight}m aprox`,
    },
    {
      id: generateId(),
      name: 'Fulminante + Clavo',
      unit: 'unidad',
      quantity: fulminantes,
      unitPrice: prices.fulminante,
      totalPrice: fulminantes * prices.fulminante,
      category: 'fijacion',
      description: 'Para fijar colgadores al techo',
    },
    {
      id: generateId(),
      name: 'Tornillo Drywall 1"',
      unit: 'unidad',
      quantity: drywallScrews,
      unitPrice: prices.tornilloDrywall1inch,
      totalPrice: drywallScrews * prices.tornilloDrywall1inch,
      category: 'fijacion',
    },
    {
      id: generateId(),
      name: 'Tornillo Wafer',
      unit: 'unidad',
      quantity: mainChannelPieces * WAFER_SCREWS_PER_STUD,
      unitPrice: prices.tornilloWafer,
      totalPrice: mainChannelPieces * WAFER_SCREWS_PER_STUD * prices.tornilloWafer,
      category: 'fijacion',
    },
    {
      id: generateId(),
      name: 'Cinta para Juntas (rollo 75m)',
      unit: 'rollo',
      quantity: Math.ceil(tapeMeters / 75),
      unitPrice: prices.cintaPapel,
      totalPrice: Math.ceil(tapeMeters / 75) * prices.cintaPapel,
      category: 'acabado',
    },
    {
      id: generateId(),
      name: 'Masilla para Juntas (bolsa 28kg)',
      unit: 'bolsa',
      quantity: Math.ceil(compoundKg / 28),
      unitPrice: prices.masilla,
      totalPrice: Math.ceil(compoundKg / 28) * prices.masilla,
      category: 'acabado',
    },
  ];

  return materials;
}

// Merge duplicate materials and sum quantities
export function mergeMaterials(materialsList: Material[][]): Material[] {
  const merged = new Map<string, Material>();

  for (const materials of materialsList) {
    for (const mat of materials) {
      const existing = merged.get(mat.name);
      if (existing) {
        existing.quantity += mat.quantity;
        existing.totalPrice += mat.totalPrice;
      } else {
        merged.set(mat.name, { ...mat, id: generateId() });
      }
    }
  }

  return Array.from(merged.values());
}

export function calculateTotalCost(materials: Material[]): number {
  return materials.reduce((total, m) => total + m.totalPrice, 0);
}

// Get summary stats for charts
export function getMaterialsByCategory(materials: Material[]) {
  const categories = new Map<string, number>();
  for (const mat of materials) {
    const current = categories.get(mat.category) || 0;
    categories.set(mat.category, current + mat.totalPrice);
  }

  const labels: Record<string, string> = {
    estructura: 'Estructura Metálica',
    plancha: 'Planchas Drywall',
    acabado: 'Acabados',
    fijacion: 'Fijaciones',
  };

  return Array.from(categories.entries()).map(([key, value]) => ({
    name: labels[key] || key,
    value: Math.round(value * 100) / 100,
    category: key,
  }));
}

export function calculateLaborCost(
  walls: WallMeasurement[],
  ceilings: CeilingMeasurement[],
  labor: LaborCosts
) {
  if (!labor.includeLabor) {
    return {
      totalLabor: 0,
      wallLabor: 0,
      ceilingLabor: 0,
      finishingLabor: 0,
      totalArea: 0,
    };
  }

  let wallAreaTotal = 0;
  let wallLabor = 0;

  for (const w of walls) {
    const grossArea = w.width * w.height;
    const openingsArea = calculateOpeningsArea(w.openings);
    const netArea = Math.max(grossArea - openingsArea, 0);
    wallAreaTotal += netArea;

    const rate = w.hasDoubleSide
      ? labor.costPerSqmTabiqueDoble
      : labor.costPerSqmTabiqueSimple;
    wallLabor += netArea * rate;
  }

  let ceilingAreaTotal = 0;
  let ceilingLabor = 0;

  for (const c of ceilings) {
    const area = c.width * c.length;
    ceilingAreaTotal += area;
    ceilingLabor += area * labor.costPerSqmCieloRaso;
  }

  const totalDrywallSurface = walls.reduce((sum, w) => {
    const net = Math.max(w.width * w.height - calculateOpeningsArea(w.openings), 0);
    return sum + (w.hasDoubleSide ? net * 2 : net);
  }, 0) + ceilingAreaTotal;

  const finishingLabor = totalDrywallSurface * labor.costPerSqmAcabado;
  const totalLabor = wallLabor + ceilingLabor + finishingLabor;

  return {
    totalLabor: Math.round(totalLabor * 100) / 100,
    wallLabor: Math.round(wallLabor * 100) / 100,
    ceilingLabor: Math.round(ceilingLabor * 100) / 100,
    finishingLabor: Math.round(finishingLabor * 100) / 100,
    totalArea: Math.round((wallAreaTotal + ceilingAreaTotal) * 100) / 100,
  };
}

