import type {
  Material,
  WallMeasurement,
  CeilingMeasurement,
  Opening,
  MaterialPrices,
  LaborCosts,
  BoardType,
  WorkSchedule,
  CrewSize,
} from '../types';
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
  CREW_CONFIGS,
} from './constants';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function calculateOpeningsArea(openings: Opening[]): number {
  return openings.reduce((total, op) => total + op.width * op.height, 0);
}

// Get the sheet info according to board type
function getSheetInfo(boardType: BoardType | undefined, prices: MaterialPrices) {
  switch (boardType) {
    case 'RH':
      return {
        name: 'Plancha Drywall RH Verde 1/2" (12.7mm)',
        unitPrice: prices.planchaDrywallRH,
        description: 'Antihumedad para baños, cocinas y zonas húmedas',
      };
    case 'RF':
      return {
        name: 'Plancha Drywall RF Cortafuego 1/2" (12.7mm)',
        unitPrice: prices.planchaDrywallRF,
        description: 'Resistente al fuego con fibra de vidrio',
      };
    case 'Superboard':
      return {
        name: 'Placa Fibrocemento Superboard 6mm',
        unitPrice: prices.planchaSuperboard6mm,
        description: 'Para exteriores, fachadas y zonas a la intemperie',
      };
    case 'ST':
    default:
      return {
        name: 'Plancha Drywall ST Standard 1/2" (12.7mm)',
        unitPrice: prices.planchaDrywall12mm,
        description: `${SHEET_WIDTH}m × ${SHEET_HEIGHT}m (4'×8') Standard`,
      };
  }
}

export function calculateWallMaterials(wall: WallMeasurement, prices: MaterialPrices): Material[] {
  const grossArea = wall.width * wall.height;
  const openingsArea = calculateOpeningsArea(wall.openings);
  const netArea = Math.max(grossArea - openingsArea, 0.1);
  const sides = wall.hasDoubleSide ? 2 : 1;
  const drywallArea = netArea * sides;

  // Sheets
  const sheetsRaw = drywallArea / SHEET_AREA;
  const sheets = Math.ceil(sheetsRaw * WASTE_FACTOR);

  // Studs: one every STUD_SPACING along width, plus 1 at each end
  let studsCount = Math.ceil(wall.width / STUD_SPACING) + 1;

  // Tracks: top + bottom — tracks come in 3.05m lengths (10ft)
  const trackMeters = wall.width * 2;
  let trackPieces = Math.ceil(trackMeters / 3.05);

  // Openings extra framing
  const extraStuds = wall.openings.length * 4;
  const headerPieces = wall.openings.length * 2;

  // Drywall screws
  const drywallScrews = sheets * SCREWS_PER_SHEET;

  // Wafer screws
  const waferScrews = (studsCount + extraStuds) * WAFER_SCREWS_PER_STUD;

  // Joint tape
  const tapeMeters = Math.ceil(sheets * TAPE_PER_SHEET);

  // Joint compound (masilla)
  const compoundKg = Math.ceil(drywallArea * COMPOUND_PER_SQM);
  const compoundBags = Math.ceil(compoundKg / 28);

  // Corner beads (esquineros)
  const cornerBeadMeters = wall.openings.reduce((total, op) => {
    if (op.type === 'puerta') return total + op.height * 2;
    return total + (op.width * 2 + op.height * 2);
  }, 0);
  const cornerBeadPieces = Math.ceil(cornerBeadMeters / 2.44);

  const sheetInfo = getSheetInfo(wall.boardType, prices);

  const materials: Material[] = [
    {
      id: generateId(),
      name: sheetInfo.name,
      unit: 'unidad',
      quantity: sheets,
      unitPrice: sheetInfo.unitPrice,
      totalPrice: sheets * sheetInfo.unitPrice,
      category: 'plancha',
      description: sheetInfo.description,
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
      description: 'Superior e inferior perimetral',
    },
    {
      id: generateId(),
      name: 'Tornillo Drywall 1"',
      unit: 'unidad',
      quantity: drywallScrews,
      unitPrice: prices.tornilloDrywall1inch,
      totalPrice: drywallScrews * prices.tornilloDrywall1inch,
      category: 'fijacion',
      description: 'Fijación de placas a perfiles metálicos',
    },
    {
      id: generateId(),
      name: 'Tornillo Wafer',
      unit: 'unidad',
      quantity: waferScrews,
      unitPrice: prices.tornilloWafer,
      totalPrice: waferScrews * prices.tornilloWafer,
      category: 'fijacion',
      description: 'Unión estructura metálica (parante con riel)',
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

  // 1. Insulation Calculation
  if (wall.insulation === 'fibra_vidrio') {
    const rolls = Math.ceil(netArea / 14.4); // 14.4m² per standard roll
    materials.push({
      id: generateId(),
      name: 'Lana de Vidrio 50mm con Foil (rollo 14.4m²)',
      unit: 'rollo',
      quantity: rolls,
      unitPrice: prices.lanaFibraVidrio50mm,
      totalPrice: rolls * prices.lanaFibraVidrio50mm,
      category: 'aislamiento',
      description: 'Aislamiento termoacústico para interior de tabique',
    });
  } else if (wall.insulation === 'lana_roca') {
    const packs = Math.ceil(netArea / 7.2); // 7.2m² per acoustic pack
    materials.push({
      id: generateId(),
      name: 'Lana de Roca Acústica Alta Densidad (paquete 7.2m²)',
      unit: 'paquete',
      quantity: packs,
      unitPrice: prices.lanaRocaPaquete,
      totalPrice: packs * prices.lanaRocaPaquete,
      category: 'aislamiento',
      description: 'Barrera acústica de máxima insonorización',
    });
  }

  // 2. Lighted Niche / TV Center detail
  if (wall.hasLightNiche || wall.type === 'nicho') {
    const nicheProfiles = 2; // 2 profiles of 2m (4m total)
    const ledMeters = 4;
    materials.push({
      id: generateId(),
      name: 'Perfil de Aluminio LED + Difusor (2m)',
      unit: 'unidad',
      quantity: nicheProfiles,
      unitPrice: prices.perfilLedAluminio,
      totalPrice: nicheProfiles * prices.perfilLedAluminio,
      category: 'iluminacion',
      description: 'Para empotrar en marco de nicho decorativo',
    });
    materials.push({
      id: generateId(),
      name: 'Tira LED Alta Calidad 12V/24V',
      unit: 'metro',
      quantity: ledMeters,
      unitPrice: prices.tiraLedMetro,
      totalPrice: ledMeters * prices.tiraLedMetro,
      category: 'iluminacion',
      description: 'Luz indirecta decorativa para nicho',
    });
  }

  return materials;
}

export function calculateCeilingMaterials(ceiling: CeilingMeasurement, prices: MaterialPrices): Material[] {
  const area = ceiling.width * ceiling.length;

  // Sheets
  const sheetsRaw = area / SHEET_AREA;
  const sheets = Math.ceil(sheetsRaw * WASTE_FACTOR);

  // Omegas/Channels
  const mainChannelCount = Math.ceil(ceiling.width / STUD_SPACING_CEILING) + 1;
  const mainChannelPieces = mainChannelCount * Math.ceil(ceiling.length / 3.05);

  // Perimeter tracks
  const perimeterMeters = (ceiling.width + ceiling.length) * 2;
  const perimeterPieces = Math.ceil(perimeterMeters / 3.05);

  // Hangers
  const hangersPerChannel = Math.ceil(ceiling.length / 1.2);
  const totalHangers = mainChannelCount * hangersPerChannel;

  // Fasteners
  const drywallScrews = sheets * SCREWS_PER_SHEET;
  const tapeMeters = Math.ceil(sheets * TAPE_PER_SHEET);
  const compoundKg = Math.ceil(area * COMPOUND_PER_SQM);
  const fulminantes = totalHangers;

  const sheetInfo = getSheetInfo(ceiling.boardType, prices);

  const materials: Material[] = [
    {
      id: generateId(),
      name: sheetInfo.name,
      unit: 'unidad',
      quantity: sheets,
      unitPrice: sheetInfo.unitPrice,
      totalPrice: sheets * sheetInfo.unitPrice,
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
      description: 'Ángulo perimetral de apoyo',
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
      name: 'Fulminante + Clavo de Impacto',
      unit: 'unidad',
      quantity: fulminantes,
      unitPrice: prices.fulminante,
      totalPrice: fulminantes * prices.fulminante,
      category: 'fijacion',
      description: 'Fijación de cuelgues a losa de concreto',
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

  // Insulation in ceiling
  if (ceiling.insulation === 'fibra_vidrio') {
    const rolls = Math.ceil(area / 14.4);
    materials.push({
      id: generateId(),
      name: 'Lana de Vidrio 50mm con Foil (rollo 14.4m²)',
      unit: 'rollo',
      quantity: rolls,
      unitPrice: prices.lanaFibraVidrio50mm,
      totalPrice: rolls * prices.lanaFibraVidrio50mm,
      category: 'aislamiento',
      description: 'Aislamiento térmico bajo losa / techo',
    });
  } else if (ceiling.insulation === 'lana_roca') {
    const packs = Math.ceil(area / 7.2);
    materials.push({
      id: generateId(),
      name: 'Lana de Roca Acústica Alta Densidad (paquete 7.2m²)',
      unit: 'paquete',
      quantity: packs,
      unitPrice: prices.lanaRocaPaquete,
      totalPrice: packs * prices.lanaRocaPaquete,
      category: 'aislamiento',
      description: 'Aislante acústico de alta densidad',
    });
  }

  // Coved Ceiling with indirect LED strip (Garganta de Luz)
  if (ceiling.hasLedCove) {
    const coveMeters = ceiling.covePerimeterMeters || perimeterMeters;
    const coveTracks = Math.ceil(coveMeters / 3.05);
    const coveProfiles = Math.ceil(coveMeters / 2.0); // 2m aluminum LED profiles
    const coveLedMeters = Math.ceil(coveMeters);
    const powerSupplies = Math.max(1, Math.ceil(coveMeters / 15)); // 1 supply per 15m

    materials.push({
      id: generateId(),
      name: 'Riel Perimetral para Garganta LED 3.05m',
      unit: 'unidad',
      quantity: coveTracks,
      unitPrice: prices.rielMetalico64mm,
      totalPrice: coveTracks * prices.rielMetalico64mm,
      category: 'estructura',
      description: 'Cajón perimetral para luz indirecta',
    });
    materials.push({
      id: generateId(),
      name: 'Perfil de Aluminio LED + Difusor (2m)',
      unit: 'unidad',
      quantity: coveProfiles,
      unitPrice: prices.perfilLedAluminio,
      totalPrice: coveProfiles * prices.perfilLedAluminio,
      category: 'iluminacion',
      description: 'Difusor opalino para ocultar puntos LED',
    });
    materials.push({
      id: generateId(),
      name: 'Tira LED Continua Luz Indirecta',
      unit: 'metro',
      quantity: coveLedMeters,
      unitPrice: prices.tiraLedMetro,
      totalPrice: coveLedMeters * prices.tiraLedMetro,
      category: 'iluminacion',
      description: `${coveLedMeters}m de tira LED cálida/neutra`,
    });
    materials.push({
      id: generateId(),
      name: 'Fuente de Alimentación / Transformador 12V/24V',
      unit: 'unidad',
      quantity: powerSupplies,
      unitPrice: 45.00,
      totalPrice: powerSupplies * 45.00,
      category: 'iluminacion',
      description: 'Driver estabilizado para tira LED de techo',
    });
  }

  return materials;
}

// Painting & Sanding materials
export function calculatePaintingMaterials(
  walls: WallMeasurement[],
  ceilings: CeilingMeasurement[],
  prices: MaterialPrices
): Material[] {
  let totalDrywallSurface = 0;

  for (const w of walls) {
    const gross = w.width * w.height;
    const openings = calculateOpeningsArea(w.openings);
    const net = Math.max(gross - openings, 0);
    totalDrywallSurface += w.hasDoubleSide ? net * 2 : net;
  }

  for (const c of ceilings) {
    totalDrywallSurface += c.width * c.length;
  }

  if (totalDrywallSurface <= 0) return [];

  // Sealer: 35 m² per gallon
  const sealerGallons = Math.ceil(totalDrywallSurface / 35);

  // Latex Paint: 30 m² per gallon (2 coats)
  const paintGallons = Math.ceil(totalDrywallSurface / 30);

  // Sandpaper gr. 120 (coarse): 1 sheet every 12 m²
  const sandpaper120 = Math.max(2, Math.ceil(totalDrywallSurface / 12));

  // Sandpaper gr. 180 (fine finish): 1 sheet every 12 m²
  const sandpaper180 = Math.max(2, Math.ceil(totalDrywallSurface / 12));

  return [
    {
      id: generateId(),
      name: 'Sellador / Imprimante para Drywall (galón)',
      unit: 'galón',
      quantity: sealerGallons,
      unitPrice: prices.selladorDrywallGalon,
      totalPrice: sealerGallons * prices.selladorDrywallGalon,
      category: 'pintura',
      description: `Rinde ~35m²/galón sobre ${totalDrywallSurface.toFixed(1)}m² de placas`,
    },
    {
      id: generateId(),
      name: 'Pintura Látex Lavable Mate (galón)',
      unit: 'galón',
      quantity: paintGallons,
      unitPrice: prices.pinturaLatexGalon,
      totalPrice: paintGallons * prices.pinturaLatexGalon,
      category: 'pintura',
      description: '2 manos de acabado final uniforme',
    },
    {
      id: generateId(),
      name: 'Lija de Agua Grano 120 (Desbaste)',
      unit: 'pliego',
      quantity: sandpaper120,
      unitPrice: prices.lijaAguaPliego,
      totalPrice: sandpaper120 * prices.lijaAguaPliego,
      category: 'pintura',
      description: 'Lijado inicial de masilla y uniones',
    },
    {
      id: generateId(),
      name: 'Lija de Agua Grano 180 (Acabado Fino)',
      unit: 'pliego',
      quantity: sandpaper180,
      unitPrice: prices.lijaAguaPliego,
      totalPrice: sandpaper180 * prices.lijaAguaPliego,
      category: 'pintura',
      description: 'Lijado suave para terminación lisa',
    },
  ];
}

// Work schedule & project duration estimator
export function calculateWorkSchedule(
  walls: WallMeasurement[],
  ceilings: CeilingMeasurement[],
  crewSize: CrewSize = '1_maestro_1_ayudante',
  includePainting: boolean = false
): WorkSchedule {
  let wallNetArea = 0;
  let totalDrywallSurface = 0;

  for (const w of walls) {
    const gross = w.width * w.height;
    const openings = calculateOpeningsArea(w.openings);
    const net = Math.max(gross - openings, 0);
    wallNetArea += net;
    totalDrywallSurface += w.hasDoubleSide ? net * 2 : net;
  }

  let ceilingArea = 0;
  for (const c of ceilings) {
    ceilingArea += c.width * c.length;
    totalDrywallSurface += c.width * c.length;
  }

  const totalArea = wallNetArea + ceilingArea;
  if (totalArea <= 0) {
    return {
      structureDays: 0,
      sheetingDays: 0,
      muddingDays: 0,
      paintingDays: 0,
      totalDays: 0,
      crewDescription: CREW_CONFIGS[crewSize].label,
      estimatedCompletionDate: new Date().toLocaleDateString('es-PE'),
    };
  }

  const factor = CREW_CONFIGS[crewSize].factor;

  // Base daily outputs for 1 standard crew (1 master + 1 assistant):
  // Structure: ~30 m²/day
  // Sheeting: ~35 m²/day
  // Mudding / tape / 3 coats: ~25 m²/day + 1 buffer day for curing & drying
  // Painting: ~45 m²/day (2 coats)
  const structureDays = Math.max(1, Math.ceil(totalArea / (30 * factor)));
  const sheetingDays = Math.max(1, Math.ceil(totalDrywallSurface / (35 * factor)));
  const muddingDays = Math.max(2, Math.ceil(totalDrywallSurface / (25 * factor)) + 1);
  const paintingDays = includePainting ? Math.max(1, Math.ceil(totalDrywallSurface / (45 * factor))) : 0;

  const totalDays = structureDays + sheetingDays + muddingDays + paintingDays;

  // Calculate estimated completion date (skipping Sundays)
  const targetDate = new Date();
  let addedDays = 0;
  while (addedDays < totalDays) {
    targetDate.setDate(targetDate.getDate() + 1);
    if (targetDate.getDay() !== 0) { // skip Sunday
      addedDays++;
    }
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return {
    structureDays,
    sheetingDays,
    muddingDays,
    paintingDays,
    totalDays,
    crewDescription: CREW_CONFIGS[crewSize].label,
    estimatedCompletionDate: targetDate.toLocaleDateString('es-PE', dateOptions),
  };
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
    aislamiento: 'Aislamiento Térmico/Acústico',
    acabado: 'Cintas y Masillas',
    fijacion: 'Tornillos y Fijaciones',
    iluminacion: 'Perfiles e Iluminación LED',
    pintura: 'Pintura y Selladores',
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
  labor: LaborCosts,
  includePainting: boolean = false
) {
  if (!labor.includeLabor) {
    return {
      totalLabor: 0,
      wallLabor: 0,
      ceilingLabor: 0,
      finishingLabor: 0,
      paintingLabor: 0,
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
  const paintingLabor = includePainting ? totalDrywallSurface * (labor.costPerSqmPintura || 8.00) : 0;
  const totalLabor = wallLabor + ceilingLabor + finishingLabor + paintingLabor;

  return {
    totalLabor: Math.round(totalLabor * 100) / 100,
    wallLabor: Math.round(wallLabor * 100) / 100,
    ceilingLabor: Math.round(ceilingLabor * 100) / 100,
    finishingLabor: Math.round(finishingLabor * 100) / 100,
    paintingLabor: Math.round(paintingLabor * 100) / 100,
    totalArea: Math.round((wallAreaTotal + ceilingAreaTotal) * 100) / 100,
  };
}
