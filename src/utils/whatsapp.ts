import type { Project, Material } from '../types';

export function formatWhatsAppOrder(project: Project): string {
  const dateStr = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const categoriesOrder: Array<{
    category: Material['category'];
    title: string;
    icon: string;
  }> = [
    { category: 'plancha', title: 'PLACAS Y PANELES DRYWALL', icon: '🧱' },
    { category: 'aislamiento', title: 'AISLAMIENTO TERMOACÚSTICO', icon: '🔇' },
    { category: 'estructura', title: 'PERFILERÍA Y ESTRUCTURA METÁLICA', icon: '🔩' },
    { category: 'fijacion', title: 'TORNILLERÍA Y FIJACIONES', icon: '🛠️' },
    { category: 'acabado', title: 'MASILLAS, CINTAS Y ESQUINEROS', icon: '🎨' },
    { category: 'iluminacion', title: 'PERFILES LED E ILUMINACIÓN', icon: '💡' },
    { category: 'pintura', title: 'PINTURA, SELLADOR Y LIJAS', icon: '🖌️' },
  ];

  let message = `🏗️ *PEDIDO DE MATERIALES DRYWALL*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📋 *Proyecto:* ${project.name || 'Sin título'}\n`;
  if (project.client) {
    message += `👤 *Cliente / Obra:* ${project.client}\n`;
  }
  message += `📅 *Fecha:* ${dateStr}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  let totalItemsCount = 0;

  for (const group of categoriesOrder) {
    const items = project.materials.filter((m) => m.category === group.category);
    if (items.length === 0) continue;

    message += `${group.icon} *${group.title}*\n`;
    items.forEach((m) => {
      totalItemsCount += m.quantity;
      const unitLabel = m.unit === 'unidad' ? 'und' : m.unit;
      message += `  • *${m.quantity} ${unitLabel}* — ${m.name}\n`;
    });
    message += `\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *Presupuesto Estimado de Compra:* S/ ${project.materialsCost.toFixed(2)}\n`;
  message += `📦 *Total Ítems a despachar:* ${project.materials.length} materiales\n`;
  message += `\nFavor de confirmar stock y precio actualizado para programar recojo o despacho a obra.\n`;
  message += `_Generado con Sistema Drywall Pro 3D_ 🚀`;

  return message;
}

export function getWhatsAppOrderUrl(project: Project, phone?: string): string {
  const text = formatWhatsAppOrder(project);
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const baseUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : 'https://wa.me/';
  return `${baseUrl}?text=${encodeURIComponent(text)}`;
}
