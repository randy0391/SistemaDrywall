import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/useProjectStore';
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
    projects,
    currentProject,
    currentElectricalProjectId,
    setCurrentElectricalProject,
    createProject,
    linkProject,
    addElectricalItem,
    updateElectricalItem,
    removeElectricalItem,
    laborCosts,
  } = useProjectStore();

  // Find the active project for this electrical view
  const activeProject =
    projects.find((p) => p.id === currentElectricalProjectId) ||
    (currentProject?.projectType === 'electrico' || currentProject?.projectType === 'mixto'
      ? currentProject
      : projects.find((p) => p.projectType === 'electrico') || currentProject);

  const [showAddPointModal, setShowAddPointModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(!activeProject);
  const [showSwitchProjectModal, setShowSwitchProjectModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Add Point Form
  const [selectedType, setSelectedType] = useState<ElectricalPointType>('tomacorriente_doble');
  const [pointLocation, setPointLocation] = useState('');
  const [pointQuantity, setPointQuantity] = useState('1');
  const [pointNotes, setPointNotes] = useState('');

  // New Project Form
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [linkMode, setLinkMode] = useState<'independent' | 'linked'>('independent');
  const [selectedDrywallId, setSelectedDrywallId] = useState('');

  const electricalItems = activeProject?.electricalItems || [];
  const electricalMaterials = activeProject?.electricalMaterials || [];
  const materialsCost = activeProject?.electricalMaterialsCost || 0;
  const laborCost = activeProject?.electricalLaborCost || 0;
  const totalCost = activeProject?.electricalTotalCost || 0;

  const isLinked = Boolean(activeProject?.linkedProjectId || activeProject?.projectType === 'mixto');
  const linkedDrywallProject = isLinked
    ? projects.find((p) => p.id === activeProject?.linkedProjectId)
    : null;

  const handleCreateElectricalProject = () => {
    if (!newProjectName.trim()) return;

    if (linkMode === 'linked' && selectedDrywallId) {
      // Coupled to existing drywall project
      linkProject(selectedDrywallId, selectedDrywallId);
      setCurrentElectricalProject(selectedDrywallId);
    } else {
      // 100% Independent Electrical Project!
      const newProj = createProject(
        newProjectName,
        newClientName,
        'Instalaciones eléctricas residenciales y comerciales 220V',
        'electrico'
      );
      setCurrentElectricalProject(newProj.id);
    }

    setNewProjectName('');
    setNewClientName('');
    setShowNewProjectModal(false);
  };

  const handleAddPoint = () => {
    if (!activeProject) return;
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

    addElectricalItem(newItem, activeProject.id);
    setPointLocation('');
    setPointQuantity('1');
    setPointNotes('');
    setShowAddPointModal(false);
  };

  const handleIncrement = (item: ElectricalItem) => {
    if (!activeProject) return;
    updateElectricalItem(item.id, { quantity: (item.quantity || 1) + 1 }, activeProject.id);
  };

  const handleDecrement = (item: ElectricalItem) => {
    if (!activeProject) return;
    if ((item.quantity || 1) <= 1) {
      removeElectricalItem(item.id, activeProject.id);
    } else {
      updateElectricalItem(item.id, { quantity: (item.quantity || 1) - 1 }, activeProject.id);
    }
  };

  const openAddForType = (type: ElectricalPointType) => {
    setSelectedType(type);
    setShowAddPointModal(true);
  };

  // WhatsApp order text
  const whatsAppOrderText = activeProject
    ? formatElectricalWhatsAppOrder(activeProject, electricalItems, electricalMaterials)
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
    if (!activeProject) return;

    try {
      const doc = new jsPDF();
      const margin = 14;
      let y = 20;

      // Header Banner
      doc.setFillColor(217, 119, 6); // Warm Amber
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
      doc.text(`Proyecto: ${activeProject.name}`, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Cliente: ${activeProject.client || 'Particular'}`, margin, y);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 140, y);
      y += 5;
      doc.text('Sistema: Monofásico 220V Residencial y Comercial (Estricto sin trifásico)', margin, y);

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
        doc.text(`• ${it.quantity}x ${config.label}${loc}`, margin + 2, y);
        y += 5.5;
      });

      // Section 2: Materials
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('2. MATERIALES ELÉCTRICOS A DESPACHAR', margin, y);
      y += 6;

      doc.setFillColor(254, 243, 199);
      doc.rect(margin, y - 4, 182, 7, 'F');
      doc.setFontSize(8.5);
      doc.setTextColor(120, 53, 15);
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
      doc.setDrawColor(217, 119, 6);
      doc.setFillColor(254, 243, 199);
      doc.rect(95, y, 101, 14, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(180, 83, 9);
      doc.text('TOTAL PRESUPUESTO ELÉCTRICO:', 98, y + 9);
      doc.text(`S/ ${totalCost.toFixed(2)}`, 152, y + 9);

      doc.save(`Cotizacion_Electrica_${activeProject.name.replace(/\s+/g, '_')}.pdf`);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
    } catch (e) {
      console.error(e);
      alert('Error al exportar el PDF');
    }
  };

  return (
    <div className="py-2 space-y-4 max-w-lg mx-auto">
      {/* Top Mode Header Banner: Beautiful Frosted Switcher */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl shadow-inner">
        <button
          onClick={() => navigate('/calculator')}
          className="flex-1 py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>🧱</span> Módulo Drywall
        </button>
        <button
          className="flex-1 py-2 text-xs font-black rounded-xl bg-white text-amber-700 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200/50"
        >
          <span>⚡</span> Módulo Eléctrico 220V
        </button>
      </div>

      {/* Active Project Card with Clear Independent vs Linked Status */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isLinked ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>🔗</span> Vinculado a Drywall
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>⚡</span> Proyecto 100% Independiente
                </span>
              )}
            </div>

            <h2 className="text-base font-black text-slate-900 mt-1 truncate">
              {activeProject ? activeProject.name : 'Sin proyecto eléctrico seleccionado'}
            </h2>
            <p className="text-xs text-slate-500 truncate">
              {activeProject?.client ? `Cliente: ${activeProject.client}` : 'Particular'} · Monofásico 220V
              {linkedDrywallProject && ` (Vinculado a: ${linkedDrywallProject.name})`}
            </p>
          </div>

          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setShowSwitchProjectModal(true)}
              title="Cambiar proyecto eléctrico"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              🔄 Cambiar
            </button>
            <button
              onClick={() => setShowNewProjectModal(true)}
              title="Crear nuevo proyecto eléctrico"
              className="px-2.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              + Nuevo
            </button>
          </div>
        </div>

        {/* Action Row */}
        {electricalMaterials.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer shadow-xs"
            >
              <span>📲</span> Pedido WhatsApp
            </button>
            <button
              onClick={exportPDF}
              className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer shadow-xs"
            >
              <span>📄</span> Exportar PDF
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Shortcuts Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Agregar Puntos Eléctricos Monofásicos
          </label>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            220V Residencial
          </span>
        </div>

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
                className="p-3 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded-2xl text-left transition-all active:scale-95 cursor-pointer shadow-xs space-y-1.5 group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                  {conf.icon}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 leading-tight line-clamp-1">{conf.label}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {conf.wireType === 'cable14AWG' ? '#14 AWG' : conf.wireType === 'cable12AWG' ? '#12 AWG' : '#10 AWG'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Points List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>📍</span> Puntos Registrados ({electricalItems.reduce((acc, it) => acc + (it.quantity || 1), 0)})
          </h3>
          <span className="text-xs font-bold text-amber-800">
            Mano de obra: S/ {laborCost.toFixed(2)}
          </span>
        </div>

        {electricalItems.length === 0 ? (
          <div className="bg-white p-6 rounded-3xl border border-dashed border-slate-300 text-center space-y-2">
            <span className="text-3xl">🔌</span>
            <p className="text-sm font-bold text-slate-800">Sin puntos eléctricos agregados</p>
            <p className="text-xs text-slate-400">
              Toca cualquiera de los botones de arriba para registrar tomacorrientes, conmutados o alumbrado.
            </p>
          </div>
        ) : (
          electricalItems.map((item) => {
            const conf = ELECTRICAL_POINT_CONFIGS[item.type];
            return (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{conf.icon}</span>
                    <h4 className="font-bold text-slate-900 text-sm truncate">{conf.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                    {item.location && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                        📍 {item.location}
                      </span>
                    )}
                    <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md text-[10px]">
                      {conf.wireType === 'cable14AWG' ? 'Cable #14' : conf.wireType === 'cable12AWG' ? 'Cable #12' : 'Cable #10'} · Tubo {conf.conduitType}"
                    </span>
                  </div>
                  {item.notes && <p className="text-[11px] text-slate-400 mt-1">{item.notes}</p>}
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleDecrement(item)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-black text-sm text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleIncrement(item)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeElectricalItem(item.id, activeProject?.id)}
                    className="ml-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer p-1"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Calculated Materials Section */}
      {electricalMaterials.length > 0 && (
        <div className="space-y-4 pt-1">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
              Lista de Materiales a Comprar
            </h3>
            <p className="text-[11px] text-slate-500 px-1">Calculado con 10% de desperdicio y holgura técnica</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-amber-50/70 px-4 py-3 border-b border-amber-100 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Desglose para Ferretería Eléctrica
              </span>
              <span className="text-xs font-black text-amber-900">S/ {materialsCost.toFixed(2)}</span>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {electricalMaterials.map((mat) => (
                <div key={mat.id} className="py-2.5 px-2 flex items-center justify-between text-xs">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-slate-800">{mat.name}</p>
                    {mat.description && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{mat.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-0.5 bg-amber-50 text-amber-800 font-black rounded-lg text-xs border border-amber-200/60">
                      {mat.quantity} {mat.unit}
                    </span>
                    <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                      S/ {mat.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mano de Obra Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">👷</span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Mano de Obra por Puntos</h4>
                  <p className="text-[11px] text-slate-500">Tarifas configuradas en ajustes</p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">S/ {laborCost.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tomacorrientes (S/ {laborCosts.costPerPointTomacorriente}/pto):</span>
                <span className="font-bold text-slate-800">
                  {electricalItems
                    .filter((it) => it.type.startsWith('tomacorriente'))
                    .reduce((s, it) => s + it.quantity, 0)} puntos
                </span>
              </div>
              <div className="flex justify-between">
                <span>Puntos de Alumbrado y Conmutados:</span>
                <span className="font-bold text-slate-800">
                  {electricalItems
                    .filter((it) => it.type.startsWith('luz'))
                    .reduce((s, it) => s + it.quantity, 0)} puntos
                </span>
              </div>
              {electricalItems.some((it) => it.type === 'tablero_monofasico') && (
                <div className="flex justify-between text-amber-800 font-semibold">
                  <span>Tablero Monofásico:</span>
                  <span>S/ {laborCosts.costPerTableroMonofasico}</span>
                </div>
              )}
            </div>
          </div>

          {/* Grand Total Eléctrico Card */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-5 rounded-3xl shadow-xl shadow-amber-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-100">
              <span>Materiales: S/ {materialsCost.toFixed(2)}</span>
              <span>Mano de Obra: S/ {laborCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/20">
              <div>
                <p className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                  Total Presupuesto Eléctrico
                </p>
                <p className="text-2xl font-black mt-0.5">S/ {totalCost.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="px-4 py-2 bg-white text-orange-900 text-xs font-black rounded-2xl shadow-md hover:bg-amber-50 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                Pedir WhatsApp 📲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Electrical Project (With Independent vs Linked choice) */}
      <Modal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        title="⚡ Nuevo Presupuesto Eléctrico Monofásico"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Puedes cotizar este trabajo de electricidad como una obra 100% independiente, o asociarlo a un proyecto de drywall existente.
          </p>

          <Input
            label="Nombre del Proyecto / Trabajo Eléctrico"
            placeholder="Ej: Cableado y Tomacorrientes Dpto 402"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />

          <Input
            label="Cliente / Contacto"
            placeholder="Nombre del cliente o departamento"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
          />

          {/* Choice: Independent vs Linked */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Modalidad de Proyecto</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLinkMode('independent')}
                className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                  linkMode === 'independent'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-black shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-lg block">⚡</span>
                <p className="font-bold mt-1">100% Independiente</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Trabajo solo de electricidad</p>
              </button>

              <button
                type="button"
                onClick={() => setLinkMode('linked')}
                className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                  linkMode === 'linked'
                    ? 'border-purple-500 bg-purple-50/80 text-purple-950 font-black shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-lg block">🔗</span>
                <p className="font-bold mt-1">Vincular a Drywall</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Es parte de una obra de drywall</p>
              </button>
            </div>
          </div>

          {linkMode === 'linked' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Seleccionar Proyecto de Drywall Existente
              </label>
              <select
                value={selectedDrywallId}
                onChange={(e) => setSelectedDrywallId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Seleccionar proyecto --</option>
                {projects
                  .filter((p) => p.projectType !== 'electrico')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client || 'Sin cliente'})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <Button
            fullWidth
            onClick={handleCreateElectricalProject}
            className="py-3 bg-amber-600 hover:bg-amber-700 font-bold"
          >
            Iniciar Presupuesto Eléctrico 🚀
          </Button>
        </div>
      </Modal>

      {/* Modal: Switch Electrical Project */}
      <Modal
        isOpen={showSwitchProjectModal}
        onClose={() => setShowSwitchProjectModal(false)}
        title="🔄 Seleccionar Obra Eléctrica"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">Elige qué obra deseas abrir en el módulo eléctrico:</p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {projects.map((p) => {
              const isCurr = p.id === activeProject?.id;
              const isElecOnly = p.projectType === 'electrico';
              const pItems = p.electricalItems?.length || 0;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setCurrentElectricalProject(p.id);
                    setShowSwitchProjectModal(false);
                  }}
                  className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                    isCurr
                      ? 'border-amber-500 bg-amber-50/70 font-bold text-amber-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {isElecOnly ? '⚡ Proyecto Eléctrico Independiente' : `🧱 Drywall · ${pItems} puntos`}
                    </p>
                  </div>
                  <span className="text-xs font-black text-amber-800">
                    S/ {(p.electricalTotalCost || 0).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              setShowSwitchProjectModal(false);
              setShowNewProjectModal(true);
            }}
          >
            + Crear Nueva Obra Eléctrica
          </Button>
        </div>
      </Modal>

      {/* Modal: Add Point */}
      <Modal
        isOpen={showAddPointModal}
        onClose={() => setShowAddPointModal(false)}
        title="⚡ Agregar Punto Eléctrico Monofásico"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Tipo de Instalación 220V</label>
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
              label="Ubicación / Ambiente"
              placeholder="Ej: Sala, Cocina, Baño"
              value={pointLocation}
              onChange={(e) => setPointLocation(e.target.value)}
            />
          </div>

          <Input
            label="Notas adicionales (opcional)"
            placeholder="Ej: Conmutado con escalera, altura 1.10m"
            value={pointNotes}
            onChange={(e) => setPointNotes(e.target.value)}
          />

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs space-y-1">
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

      {/* Modal: WhatsApp Order */}
      <Modal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        title="📲 Pedido de Materiales Eléctricos"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Lista lista para enviar al WhatsApp de tu distribuidor eléctrico o ferretería:
          </p>

          <div className="bg-slate-900 text-amber-300 p-3 rounded-2xl font-mono text-[11px] whitespace-pre-wrap max-h-60 overflow-y-auto border border-slate-700 leading-relaxed shadow-inner">
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
