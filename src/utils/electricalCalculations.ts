import type { ElectricalItem, Material, MaterialPrices, LaborCosts, Project } from '../types';
import { ELECTRICAL_POINT_CONFIGS } from './constants';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Calculates materials for single-phase (monofásico 220V) residential/commercial electrical installations
 */
export function calculateElectricalMaterials(
  items: ElectricalItem[],
  prices: MaterialPrices
): Material[] {
  if (!items || items.length === 0) return [];

  let totalCable14 = 0;
  let totalCable12 = 0;
  let totalCable10 = 0;
  let totalConduit12 = 0;
  let totalConduit34 = 0;
  let totalCajasRect4x2 = 0;
  let totalCajasOcto = 0;

  let tomacorrientesDobles = 0;
  let tomacorrientesSimples = 0;
  let tomacorrientesIntemperie = 0;
  let interruptoresSimples = 0;
  let interruptoresConmutados = 0;
  let spotsLed = 0;
  let tableros = 0;
  let salidasFuerza = 0;

  for (const item of items) {
    const config = ELECTRICAL_POINT_CONFIGS[item.type];
    if (!config) continue;

    const qty = item.quantity || 1;

    // Accumulate wire
    if (config.wireType === 'cable14AWG') {
      totalCable14 += config.wireMetersPerPoint * qty;
    } else if (config.wireType === 'cable12AWG') {
      totalCable12 += config.wireMetersPerPoint * qty;
    } else if (config.wireType === 'cable10AWG') {
      totalCable10 += config.wireMetersPerPoint * qty;
    }

    // Accumulate conduit
    if (config.conduitType === '1/2') {
      totalConduit12 += config.conduitMetersPerPoint * qty;
    } else {
      totalConduit34 += config.conduitMetersPerPoint * qty;
    }

    // Accumulate boxes
    totalCajasRect4x2 += config.boxesPerPoint.rect4x2 * qty;
    totalCajasOcto += config.boxesPerPoint.octo * qty;

    // Devices count
    switch (item.type) {
      case 'tomacorriente_doble':
        tomacorrientesDobles += qty;
        break;
      case 'tomacorriente_simple':
        tomacorrientesSimples += qty;
        break;
      case 'tomacorriente_intemperie':
        tomacorrientesIntemperie += qty;
        break;
      case 'luz_simple':
        interruptoresSimples += qty;
        break;
      case 'luz_conmutada':
        // A three-way circuit uses 2 three-way switch plates
        interruptoresConmutados += qty * 2;
        break;
      case 'luz_dicroico':
        spotsLed += qty;
        break;
      case 'tablero_monofasico':
        tableros += qty;
        break;
      case 'salida_fuerza_monofasica':
        salidasFuerza += qty;
        break;
    }
  }

  // 10% safety margin on cables and conduits
  totalCable14 = Math.ceil(totalCable14 * 1.10);
  totalCable12 = Math.ceil(totalCable12 * 1.10);
  totalCable10 = Math.ceil(totalCable10 * 1.10);
  totalConduit12 = Math.ceil(totalConduit12 * 1.10);
  totalConduit34 = Math.ceil(totalConduit34 * 1.10);

  const materials: Material[] = [];

  // Cables
  if (totalCable14 > 0) {
    materials.push({
      id: generateId(),
      name: 'Cable Eléctrico #14 AWG (2.5 mm²)',
      unit: 'metro',
      quantity: totalCable14,
      unitPrice: prices.cable14AWGMetro,
      totalPrice: totalCable14 * prices.cable14AWGMetro,
      category: 'electrico',
      description: 'Para circuito de alumbrado, retornos y conmutaciones',
    });
  }

  if (totalCable12 > 0) {
    materials.push({
      id: generateId(),
      name: 'Cable Eléctrico #12 AWG (4.0 mm²)',
      unit: 'metro',
      quantity: totalCable12,
      unitPrice: prices.cable12AWGMetro,
      totalPrice: totalCable12 * prices.cable12AWGMetro,
      category: 'electrico',
      description: 'Para circuito de tomacorrientes (Fase, Neutro y Tierra)',
    });
  }

  if (totalCable10 > 0) {
    materials.push({
      id: generateId(),
      name: 'Cable Eléctrico #10 AWG (6.0 mm²)',
      unit: 'metro',
      quantity: totalCable10,
      unitPrice: prices.cable10AWGMetro,
      totalPrice: totalCable10 * prices.cable10AWGMetro,
      category: 'electrico',
      description: 'Para alimentador general monofásico o cargas de fuerza (terma)',
    });
  }

  // Canalización
  if (totalConduit12 > 0) {
    materials.push({
      id: generateId(),
      name: 'Tubo Corrugado Flexible Naranja 1/2"',
      unit: 'metro',
      quantity: totalConduit12,
      unitPrice: prices.tuboCorrugado12Metro,
      totalPrice: totalConduit12 * prices.tuboCorrugado12Metro,
      category: 'electrico',
      description: 'Canalización para cableado de alumbrado en drywall o losa',
    });
  }

  if (totalConduit34 > 0) {
    materials.push({
      id: generateId(),
      name: 'Tubo Corrugado Flexible Naranja 3/4"',
      unit: 'metro',
      quantity: totalConduit34,
      unitPrice: prices.tuboCorrugado34Metro,
      totalPrice: totalConduit34 * prices.tuboCorrugado34Metro,
      category: 'electrico',
      description: 'Canalización para circuito de tomacorrientes y fuerza',
    });
  }

  // Cajas
  if (totalCajasRect4x2 > 0) {
    materials.push({
      id: generateId(),
      name: 'Caja Rectangular 4"×2" (para Drywall/Pared)',
      unit: 'unidad',
      quantity: totalCajasRect4x2,
      unitPrice: prices.cajaRectangular4x2,
      totalPrice: totalCajasRect4x2 * prices.cajaRectangular4x2,
      category: 'electrico',
      description: 'Para empotrar tomacorrientes e interruptores',
    });
  }

  if (totalCajasOcto > 0) {
    materials.push({
      id: generateId(),
      name: 'Caja Octogonal 4" (Centros de Luz)',
      unit: 'unidad',
      quantity: totalCajasOcto,
      unitPrice: prices.cajaOctogonal,
      totalPrice: totalCajasOcto * prices.cajaOctogonal,
      category: 'electrico',
      description: 'Para puntos de luz y falso techo',
    });
  }

  // Dispositivos y Placas
  if (tomacorrientesDobles > 0) {
    materials.push({
      id: generateId(),
      name: 'Placa Tomacorriente Doble con Tierra 2P+T 16A 220V',
      unit: 'unidad',
      quantity: tomacorrientesDobles,
      unitPrice: prices.placaTomacorrienteDoble,
      totalPrice: tomacorrientesDobles * prices.placaTomacorrienteDoble,
      category: 'electrico',
      description: 'Línea moderna con puesta a tierra',
    });
  }

  if (tomacorrientesSimples > 0) {
    materials.push({
      id: generateId(),
      name: 'Placa Tomacorriente Simple 2P+T 16A',
      unit: 'unidad',
      quantity: tomacorrientesSimples,
      unitPrice: Math.round(prices.placaTomacorrienteDoble * 0.75 * 100) / 100,
      totalPrice: tomacorrientesSimples * Math.round(prices.placaTomacorrienteDoble * 0.75 * 100) / 100,
      category: 'electrico',
    });
  }

  if (tomacorrientesIntemperie > 0) {
    materials.push({
      id: generateId(),
      name: 'Tomacorriente 2P+T con Tapa Estanca Intemperie (IP55)',
      unit: 'unidad',
      quantity: tomacorrientesIntemperie,
      unitPrice: prices.placaTomacorrienteDoble + 15,
      totalPrice: tomacorrientesIntemperie * (prices.placaTomacorrienteDoble + 15),
      category: 'electrico',
      description: 'Protección para exteriores o baños con humedad',
    });
  }

  if (interruptoresSimples > 0) {
    materials.push({
      id: generateId(),
      name: 'Placa con Interruptor Simple (1 Golpe)',
      unit: 'unidad',
      quantity: interruptoresSimples,
      unitPrice: prices.placaInterruptorSimple,
      totalPrice: interruptoresSimples * prices.placaInterruptorSimple,
      category: 'electrico',
    });
  }

  if (interruptoresConmutados > 0) {
    materials.push({
      id: generateId(),
      name: 'Placa Interruptor Conmutado 3 Vías (Escalera/3-Way)',
      unit: 'unidad',
      quantity: interruptoresConmutados,
      unitPrice: prices.placaInterruptorConmutado,
      totalPrice: interruptoresConmutados * prices.placaInterruptorConmutado,
      category: 'electrico',
      description: '2 placas por cada punto conmutado de encendido doble',
    });
  }

  if (spotsLed > 0) {
    materials.push({
      id: generateId(),
      name: 'Spot LED Empotrable con Driver (7W - 12W)',
      unit: 'unidad',
      quantity: spotsLed,
      unitPrice: prices.spotLedEmpotrable,
      totalPrice: spotsLed * prices.spotLedEmpotrable,
      category: 'electrico',
      description: 'Para falso techo de drywall',
    });
  }

  // Tablero monofásico y protecciones
  if (tableros > 0) {
    materials.push({
      id: generateId(),
      name: 'Gabinete para Tablero Monofásico de Distribución (6-8 polos)',
      unit: 'unidad',
      quantity: tableros,
      unitPrice: prices.gabineteTableroMonofasico,
      totalPrice: tableros * prices.gabineteTableroMonofasico,
      category: 'electrico',
      description: 'Para empotrar en drywall o pared',
    });
    // Llave general monofásica
    materials.push({
      id: generateId(),
      name: 'Interruptor Termomagnético Monofásico 2×25A (General)',
      unit: 'unidad',
      quantity: tableros,
      unitPrice: prices.llaveTermomagnetica2P,
      totalPrice: tableros * prices.llaveTermomagnetica2P,
      category: 'electrico',
    });
    // Llave diferencial de seguridad
    materials.push({
      id: generateId(),
      name: 'Interruptor Diferencial Monofásico 2×25A 30mA (Protección de Vida)',
      unit: 'unidad',
      quantity: tableros,
      unitPrice: prices.llaveDiferencial2P,
      totalPrice: tableros * prices.llaveDiferencial2P,
      category: 'electrico',
      description: 'Obligatorio según Código Nacional de Electricidad',
    });
    // Llaves secundarias (alumbrado y tomacorrientes)
    materials.push({
      id: generateId(),
      name: 'Interruptor Termomagnético Monofásico 2×16A (Alumbrado)',
      unit: 'unidad',
      quantity: tableros,
      unitPrice: prices.llaveTermomagnetica2P,
      totalPrice: tableros * prices.llaveTermomagnetica2P,
      category: 'electrico',
    });
    materials.push({
      id: generateId(),
      name: 'Interruptor Termomagnético Monofásico 2×20A (Tomacorrientes)',
      unit: 'unidad',
      quantity: tableros,
      unitPrice: prices.llaveTermomagnetica2P,
      totalPrice: tableros * prices.llaveTermomagnetica2P,
      category: 'electrico',
    });
  }

  if (salidasFuerza > 0) {
    materials.push({
      id: generateId(),
      name: 'Interruptor Termomagnético Monofásico 2×25A para Terma/Carga',
      unit: 'unidad',
      quantity: salidasFuerza,
      unitPrice: prices.llaveTermomagnetica2P,
      totalPrice: salidasFuerza * prices.llaveTermomagnetica2P,
      category: 'electrico',
      description: 'Circuito independiente para calentador de agua o terma',
    });
  }

  // Consumibles: Cinta aislante
  const totalPoints = items.reduce((s, it) => s + (it.quantity || 1), 0);
  const rollsTape = Math.max(1, Math.ceil(totalPoints / 6));
  materials.push({
    id: generateId(),
    name: 'Cinta Aislante Eléctrica Profesional 3M / Temflex',
    unit: 'rollo',
    quantity: rollsTape,
    unitPrice: prices.cintaAislante,
    totalPrice: rollsTape * prices.cintaAislante,
    category: 'electrico',
  });

  return materials;
}

/**
 * Calculates labor cost for electrical single-phase points
 */
export function calculateElectricalLabor(
  items: ElectricalItem[],
  labor: LaborCosts
): {
  totalLabor: number;
  breakdown: Array<{ name: string; quantity: number; unitRate: number; total: number }>;
} {
  if (!items || items.length === 0) {
    return { totalLabor: 0, breakdown: [] };
  }

  const breakdown: Array<{ name: string; quantity: number; unitRate: number; total: number }> = [];
  let totalLabor = 0;

  for (const item of items) {
    const qty = item.quantity || 1;
    let rate = 0;

    switch (item.type) {
      case 'tomacorriente_doble':
      case 'tomacorriente_simple':
        rate = labor.costPerPointTomacorriente;
        break;
      case 'tomacorriente_intemperie':
        rate = labor.costPerPointTomacorriente + 10;
        break;
      case 'luz_simple':
        rate = labor.costPerPointLuzSimple;
        break;
      case 'luz_conmutada':
        rate = labor.costPerPointConmutado;
        break;
      case 'luz_dicroico':
        rate = labor.costPerPointDicroico;
        break;
      case 'tablero_monofasico':
        rate = labor.costPerTableroMonofasico;
        break;
      case 'salida_fuerza_monofasica':
        rate = labor.costPerPointFuerza;
        break;
    }

    const itemTotal = qty * rate;
    totalLabor += itemTotal;

    breakdown.push({
      name: ELECTRICAL_POINT_CONFIGS[item.type]?.label || item.name,
      quantity: qty,
      unitRate: rate,
      total: itemTotal,
    });
  }

  return {
    totalLabor: Math.round(totalLabor * 100) / 100,
    breakdown,
  };
}

/**
 * Formats a WhatsApp order exclusively for electrical hardware stores / distributors
 */
export function formatElectricalWhatsAppOrder(
  project: Project,
  items: ElectricalItem[],
  materials: Material[]
): string {
  const dateStr = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let message = `⚡ *PEDIDO DE MATERIALES ELÉCTRICOS MONOFÁSICOS (220V)*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📋 *Proyecto:* ${project.name || 'Sin título'}\n`;
  if (project.client) {
    message += `👤 *Cliente:* ${project.client}\n`;
  }
  message += `📅 *Fecha:* ${dateStr}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Resumen de puntos instalados
  message += `📍 *PUNTOS A INSTALAR:*\n`;
  items.forEach((it) => {
    const label = ELECTRICAL_POINT_CONFIGS[it.type]?.label || it.name;
    const loc = it.location ? ` (${it.location})` : '';
    message += `  • *${it.quantity}x* ${label}${loc}\n`;
  });
  message += `\n`;

  // Materiales a despachar
  message += `📦 *MATERIALES REQUERIDOS:*\n`;
  let subtotal = 0;
  materials.forEach((m) => {
    subtotal += m.totalPrice;
    const unitLabel = m.unit === 'unidad' ? 'und' : m.unit;
    message += `  • *${m.quantity} ${unitLabel}* — ${m.name}\n`;
  });

  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *Presupuesto Estimado de Compra:* S/ ${subtotal.toFixed(2)}\n`;
  message += `_Nota: Instalación estrictamente monofásica 220V (libre de trifásico)_\n`;
  message += `_Generado con Sistema Drywall & Eléctrico Pro_ 🚀`;

  return message;
}
