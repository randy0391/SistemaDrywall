import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/useProjectStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import type { ElectricalItem, ElectricalPointType } from '../types';
import { ELECTRICAL_POINT_CONFIGS } from '../utils/constants';
import { formatElectricalWhatsAppOrder } from '../utils/electricalCalculations';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export default function ElectricalPage() {
  const navigate = useNavigate();
  const {
    currentProject,
    createProject,
    addElectricalItem,
    updateElectricalItem,
    removeElectricalItem,
    laborCosts,
  } = useProjectStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ElectricalPointType>('tomacorriente_doble');
  const [pointLocation, setPointLocation] = useState('');
  const [pointQuantity, setPointQuantity] = useState('1');
  const [pointNotes, setPointNotes] = useState('');

  // New project modal
  const [showNewProject, setShowNewProject] = useState(!currentProject);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');

  // WhatsApp Modal
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const electricalItems = currentProject?.electricalItems || [];
  const electricalMaterials = currentProject?.electricalMaterials || [];
  const materialsCost = currentProject?.electricalMaterialsCost || 0;
  const laborCost = currentProject?.electricalLaborCost || 0;
  const totalCost = currentProject?.electricalTotalCost || 0;

  const handleCreateProject = () => {
    if (!projectName.trim()) return;
    createProject(projectName, clientName, 'Trabajos eléctricos monofásicos');
    setShowNewProject(false);
  };

  const handleAddPoint = () => {
    const qty = parseInt(pointQuantity) || 1;
    const config = ELECTRICAL_POINT_CONFIGS[selectedType];
    const newItem: ElectricalItem = {
      id: generateId(),
      name: config.name,
      type: selectedType,
      quantity: Math.max(1, qty),
      location: pointLocation.trim() || undefined,
      notes: pointNotes.trim() || undefined,
    };

    addElectricalItem(newItem);
    setPointLocation('');
    setPointQuantity('1');
    setPointNotes('');
    setShowAddModal(false);
  };

  const handleIncrement = (item: ElectricalItem) => {
    updateElectricalItem(item.id, { quantity: (item.quantity || 1) + 1 });
  };

  const handleDecrement = (item: ElectricalItem) => {
    if ((item.quantity || 1) <= 1) {
      removeElectricalItem(item.id);
    } else {
      updateElectricalItem(item.id, { quantity: (item.quantity || 1) - 1 });
    }
  };

  const openAddForType = (type: ElectricalPointType) => {
    setSelectedType(type);
    setShowAddModal(true);
  };

  // WhatsApp order
  const whatsAppOrderText = currentProject
    ? formatElectricalWhatsAppOrder(currentProject, electricalItems, electricalMaterials)
    : '';

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsAppOrderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Error al copiar el texto');
    }
  };

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsAppOrderText)}`;
    window.open(url, '_blank');
  };

  // Export PDF
  const exportPDF = () => {
    if (!currentProject) return;

    try {
      const doc = new jsPDF();
      const margin = 14;
      let y = 20;

      // Header Banner
      doc.setFillColor(234, 88, 12); // Orange / Amber for Electrical
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('COTIZACIÓN DE INSTALACIONES ELÉCTRICAS', margin, 18);

      // Project Info
      y = 38;
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Proyecto: ${currentProject.name}`, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Cliente: ${currentProject.client || 'Particular'}`, margin, y);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 140, y);
      y += 5;
      doc.text('Sistema: Monofásico 220V Residencial / Comercial (Sin trifásico)', margin, y);

      // Section 1: Puntos
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('1. RESUMEN DE PUNTOS ELÉCTRICOS MONOFÁSICOS', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      electricalItems.forEach((it) => {
        const config = ELECTRICAL_POINT_CONFIGS[it.type];
        const loc = it.location ? ` — Ubicación: ${it.location}` : '';
        doc.text(
          `• ${it.quantity}x ${config.label}${loc}`,
          margin + 2,
          y
        );
        y += 5.5;
      });

      // Section 2: Materials
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('2. MATERIALES ELÉCTRICOS A DESPACHAR', margin, y);
      y += 6;

      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y - 4, 182, 7, 'F');
      doc.setFontSize(8.5);
      doc.text('Descripción del Material', margin + 2, y);
      doc.text('Cant.', 120, y);
      doc.text('P. Unit.', 145, y);
      doc.text('Subtotal', 170, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      electricalMaterials.forEach((mat) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        const nameTrunc = mat.name.length > 52 ? mat.name.substring(0, 49) + '...' : mat.name;
        doc.text(nameTrunc, margin + 2, y);
        doc.text(`${mat.quantity} ${mat.unit}`, 120, y);
        doc.text(`S/ ${mat.unitPrice.toFixed(2)}`, 145, y);
        doc.text(`S/ ${mat.totalPrice.toFixed(2)}`, 170, y);
        y += 5.5;
      });

      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal Materiales Eléctricos: S/ ${materialsCost.toFixed(2)}`, 110, y);

      // Section 3: Labor
      if (laborCost > 0) {
        y += 9;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('3. MANO DE OBRA Y SERVICIOS ELÉCTRICOS', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('• Cableado, entubado, conexionado de placas y pruebas 220V', margin + 4, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`S/ ${laborCost.toFixed(2)}`, 170, y);
      }

      // Grand Total Box
      y += 9;
      if (y > 255) {
        doc.addPage();
        y = 20;
      }
      doc.setDrawColor(234, 88, 12);
      doc.setFillColor(255, 247, 237);
      doc.rect(95, y, 101, 14, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(194, 65, 12);
      doc.text('TOTAL PRESUPUESTO ELÉCTRICO:', 98, y + 9);
      doc.text(`S/ ${totalCost.toFixed(2)}`, 152, y + 9);

      doc.save(`Cotizacion_Electrica_${currentProject.name.replace(/\s+/g, '_')}.pdf`);

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
    } catch (e) {
      console.error(e);
      alert('Error al exportar el PDF');
    }
  };

  if (showNewProject || !currentProject) {
    return (
      <div className="py-6 space-y-4 max-w-lg mx-auto">
        <div className="text-center py-2">
          <span className="text-4xl">⚡</span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Módulo de Instalaciones Eléctricas</h2>
          <p className="text-xs text-slate-500">Exclusivamente monofásico 220V (residencial y comercial)</p>
        </div>

        <Card className="space-y-4">
          <Input
            label="Nombre del Proyecto / Obra"
            placeholder="Ej: Remodelación Eléctrica Sala y Cocina"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <Input
            label="Cliente / Contacto"
            placeholder="Nombre del cliente o departamento"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <Button fullWidth onClick={handleCreateProject} className="bg-amber-600 hover:bg-amber-700 font-bold">
            Comenzar Presupuesto Eléctrico ⚡
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-3 space-y-4 max-w-lg mx-auto">
      {/* Module Switcher Header: Separado de Drywall */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => navigate('/calculator')}
          className="flex-1 py-2 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>🧱</span> Ir a Drywall
        </button>
        <button
          className="flex-1 py-2 text-xs font-bold rounded-lg bg-white text-amber-700 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>⚡</span> Módulo Eléctrico
        </button>
      </div>

      {/* Project Header Card */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md shrink-0">
                ⚡ Electricidad Monofásica
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {currentProject.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {currentProject.client || 'Sin cliente especificado'} · 220V Monofásico
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            + Agregar Punto
          </button>
        </div>

        {/* Action Row: WhatsApp & PDF */}
        {electricalMaterials.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
            >
              <span>📲</span> Pedido Eléctrico WhatsApp
            </button>
            <button
              onClick={exportPDF}
              className="py-2 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
            >
              <span>📄</span> Exportar PDF Eléctrico
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Shortcuts Grid */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Selección Rápida de Puntos Eléctricos
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              'tomacorriente_doble',
              'luz_simple',
              'luz_conmutada',
              'luz_dicroico',
              'tablero_monofasico',
              'tomacorriente_intemperie',
              'salida_fuerza_monofasica',
              'tomacorriente_simple',
            ] as ElectricalPointType[]
          ).map((type) => {
            const conf = ELECTRICAL_POINT_CONFIGS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => openAddForType(type)}
                className="p-2.5 bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-2xl text-left transition-all active:scale-95 cursor-pointer shadow-xs space-y-1"
              >
                <span className="text-xl block">{conf.icon}</span>
                <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-1">{conf.label}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {conf.wireType === 'cable14AWG' ? '#14 AWG' : conf.wireType === 'cable12AWG' ? '#12 AWG' : '#10 AWG'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Electrical Points List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>📍</span> Puntos Registrados ({electricalItems.reduce((acc, it) => acc + (it.quantity || 1), 0)})
          </h3>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
            Mano de obra: S/ {laborCost.toFixed(2)}
          </span>
        </div>

        {electricalItems.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
            <span className="text-3xl">🔌</span>
            <p className="text-sm font-semibold text-slate-700">Aún no has agregado puntos eléctricos</p>
            <p className="text-xs text-slate-400">
              Presiona cualquiera de los botones de arriba para ingresar tomacorrientes, conmutados o alumbrado.
            </p>
          </div>
        ) : (
          electricalItems.map((item) => {
            const conf = ELECTRICAL_POINT_CONFIGS[item.type];
            return (
              <Card key={item.id} className="relative overflow-hidden border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{conf.icon}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{conf.name}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                      {item.location && (
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          📍 {item.location}
                        </span>
                      )}
                      <span className="text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                        {conf.wireType === 'cable14AWG' ? 'Cable #14' : conf.wireType === 'cable12AWG' ? 'Cable #12' : 'Cable #10'} · Tubo {conf.conduitType}"
                      </span>
                    </div>
                    {item.notes && <p className="text-[11px] text-slate-400">{item.notes}</p>}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDecrement(item)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-black text-sm text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrement(item)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeElectricalItem(item.id)}
                      className="ml-2 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Calculated Electrical Materials Section */}
      {electricalMaterials.length > 0 && (
        <div className="space-y-4 pt-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>📦</span> Materiales Eléctricos Necesarios
            </h3>
            <p className="text-[11px] text-slate-500">
              Metrados con 10% de holgura técnica para cableado y canalización
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-amber-50/80 px-4 py-2.5 border-b border-amber-100 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Lista de Compra para Ferretería Eléctrica
              </span>
              <span className="text-xs font-bold text-amber-900">S/ {materialsCost.toFixed(2)}</span>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {electricalMaterials.map((mat) => (
                <div key={mat.id} className="py-2 px-2 flex items-center justify-between text-xs">
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-slate-800">{mat.name}</p>
                    {mat.description && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{mat.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded text-xs border border-amber-200">
                      {mat.quantity} {mat.unit}
                    </span>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      S/ {mat.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mano de Obra Eléctrica Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">👷</span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Mano de Obra por Puntos Eléctricos</h4>
                  <p className="text-[11px] text-slate-500">Tarifas configuradas en ajustes</p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">S/ {laborCost.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tomacorrientes (S/ {laborCosts.costPerPointTomacorriente}/pto):</span>
                <span className="font-semibold text-slate-800">
                  {electricalItems
                    .filter((it) => it.type.startsWith('tomacorriente'))
                    .reduce((s, it) => s + it.quantity, 0)} puntos
                </span>
              </div>
              <div className="flex justify-between">
                <span>Alumbrado y Conmutados:</span>
                <span className="font-semibold text-slate-800">
                  {electricalItems
                    .filter((it) => it.type.startsWith('luz'))
                    .reduce((s, it) => s + it.quantity, 0)} puntos
                </span>
              </div>
              {electricalItems.some((it) => it.type === 'tablero_monofasico') && (
                <div className="flex justify-between text-amber-800 font-medium">
                  <span>Tablero Monofásico (peinado y llaves):</span>
                  <span>S/ {laborCosts.costPerTableroMonofasico}</span>
                </div>
              )}
            </div>
          </div>

          {/* Grand Total Eléctrico Box */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-4 rounded-2xl shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-100">
              <span>Materiales Eléctricos: S/ {materialsCost.toFixed(2)}</span>
              <span>Mano de Obra: S/ {laborCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-amber-500/60">
              <div>
                <p className="text-xs font-medium text-amber-200 uppercase tracking-wider">
                  Total Presupuesto Eléctrico
                </p>
                <p className="text-2xl font-black mt-0.5">S/ {totalCost.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="px-4 py-2 bg-white text-orange-900 text-xs font-bold rounded-xl shadow-md hover:bg-amber-50 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ml-2"
              >
                Pedir a Ferretería 📲
              </button>
            </div>
          </div>

          {/* Consolidated Summary Preview */}
          {currentProject.totalCost > 0 && (
            <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-800">Presupuesto General Combinado:</p>
                <p className="text-[11px] text-slate-500">
                  Drywall (S/ {currentProject.totalCost.toFixed(2)}) + Eléctrica (S/ {totalCost.toFixed(2)})
                </p>
              </div>
              <span className="text-sm font-black text-blue-900">
                S/ {(currentProject.totalCost + totalCost).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Electrical Point */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="⚡ Agregar Punto Eléctrico Monofásico"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Tipo de Instalación Monofásica</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ELECTRICAL_POINT_CONFIGS) as ElectricalPointType[]).map((pKey) => {
                const conf = ELECTRICAL_POINT_CONFIGS[pKey];
                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => setSelectedType(pKey)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer space-y-1 ${
                      selectedType === pKey
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg block">{conf.icon}</span>
                    <p className="font-bold leading-tight">{conf.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cantidad de Puntos"
              type="number"
              min="1"
              value={pointQuantity}
              onChange={(e) => setPointQuantity(e.target.value)}
            />
            <Input
              label="Ubicación / Sector"
              placeholder="Ej: Sala, Cocina, Pasadizo"
              value={pointLocation}
              onChange={(e) => setPointLocation(e.target.value)}
            />
          </div>

          <Input
            label="Notas adicionales (opcional)"
            placeholder="Ej: A 1.10m de altura, conmutado con cabecera"
            value={pointNotes}
            onChange={(e) => setPointNotes(e.target.value)}
          />

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
            <p className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>ℹ️</span> {ELECTRICAL_POINT_CONFIGS[selectedType].name}
            </p>
            <p className="text-amber-800">{ELECTRICAL_POINT_CONFIGS[selectedType].description}</p>
          </div>

          <Button fullWidth onClick={handleAddPoint} className="py-3 font-bold bg-amber-600 hover:bg-amber-700">
            Guardar Punto y Calcular Materiales
          </Button>
        </div>
      </Modal>

      {/* Modal: WhatsApp Electrical Order */}
      <Modal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        title="📲 Pedido de Materiales Eléctricos"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Lista lista para enviar al WhatsApp de tu distribuidor eléctrico o ferretería especializada:
          </p>

          <div className="bg-slate-900 text-amber-300 p-3 rounded-xl font-mono text-[11px] whitespace-pre-wrap max-h-60 overflow-y-auto border border-slate-700 leading-relaxed shadow-inner">
            {whatsAppOrderText}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              {copied ? '✅ ¡Copiado!' : '📋 Copiar Texto'}
            </button>
            <Button
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={handleOpenWhatsApp}
            >
              Abrir WhatsApp 🚀
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
