import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/useProjectStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import CostChart from '../components/charts/CostChart';
import MaterialBarChart from '../components/charts/MaterialBarChart';
import SketchScannerModal from '../components/scanner/SketchScannerModal';
import ShareProjectModal from '../components/projects/ShareProjectModal';
import WhatsAppOrderModal from '../components/projects/WhatsAppOrderModal';
import CloudSyncModal from '../components/projects/CloudSyncModal';
import WorkScheduleCard from '../components/calculator/WorkScheduleCard';
import type {
  WallMeasurement,
  CeilingMeasurement,
  Opening,
  ConstructionType,
  BoardType,
  InsulationType,
} from '../types';
import {
  CONSTRUCTION_TYPES,
  BOARD_TYPES,
  INSULATION_TYPES,
} from '../utils/constants';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export default function CalculatorPage() {
  const navigate = useNavigate();
  const {
    currentProject,
    createProject,
    addWall,
    removeWall,
    addCeiling,
    removeCeiling,
    laborCosts,
    updateLaborCosts,
    togglePaintFinishing,
    setCrewSize,
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState<'tabiques' | 'cieloraso'>('tabiques');
  const [showNewProject, setShowNewProject] = useState(!currentProject);
  const [showAddWall, setShowAddWall] = useState(false);
  const [showAddCeiling, setShowAddCeiling] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);

  // New project form
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  // Wall form
  const [wallName, setWallName] = useState('');
  const [wallWidth, setWallWidth] = useState('');
  const [wallHeight, setWallHeight] = useState('2.40');
  const [wallType, setWallType] = useState<ConstructionType>('tabique');
  const [wallDoubleSide, setWallDoubleSide] = useState(true);
  const [wallBoardType, setWallBoardType] = useState<BoardType>('ST');
  const [wallInsulation, setWallInsulation] = useState<InsulationType>('ninguno');
  const [wallLightNiche, setWallLightNiche] = useState(false);
  const [openings, setOpenings] = useState<Opening[]>([]);

  // Ceiling form
  const [ceilingName, setCeilingName] = useState('');
  const [ceilingWidth, setCeilingWidth] = useState('');
  const [ceilingLength, setCeilingLength] = useState('');
  const [ceilingDrop, setCeilingDrop] = useState('0.10');
  const [ceilingBoardType, setCeilingBoardType] = useState<BoardType>('ST');
  const [ceilingInsulation, setCeilingInsulation] = useState<InsulationType>('ninguno');
  const [ceilingLedCove, setCeilingLedCove] = useState(false);

  const handleCreateProject = () => {
    if (!projectName.trim()) return;
    createProject(projectName, clientName, projectDesc);
    setShowNewProject(false);
  };

  const handleAddWall = () => {
    if (!wallWidth || !wallHeight) return;
    const wall: WallMeasurement = {
      id: generateId(),
      name: wallName || `Tabique ${(currentProject?.walls.length || 0) + 1}`,
      width: parseFloat(wallWidth),
      height: parseFloat(wallHeight),
      type: wallType,
      hasDoubleSide: wallDoubleSide,
      boardType: wallBoardType,
      insulation: wallInsulation,
      hasLightNiche: wallLightNiche,
      openings,
    };
    addWall(wall);
    setWallName('');
    setWallWidth('');
    setWallHeight('2.40');
    setWallType('tabique');
    setWallBoardType('ST');
    setWallInsulation('ninguno');
    setWallLightNiche(false);
    setOpenings([]);
    setShowAddWall(false);
  };

  const addOpening = (type: 'puerta' | 'ventana') => {
    setOpenings([
      ...openings,
      {
        id: generateId(),
        type,
        width: type === 'puerta' ? 0.9 : 1.2,
        height: type === 'puerta' ? 2.1 : 1.2,
      },
    ]);
  };

  const removeOpening = (id: string) => {
    setOpenings(openings.filter((o) => o.id !== id));
  };

  const handleAddCeiling = () => {
    if (!ceilingWidth || !ceilingLength) return;
    const ceiling: CeilingMeasurement = {
      id: generateId(),
      name: ceilingName || `Cielo Raso ${(currentProject?.ceilings.length || 0) + 1}`,
      width: parseFloat(ceilingWidth),
      length: parseFloat(ceilingLength),
      dropHeight: parseFloat(ceilingDrop),
      boardType: ceilingBoardType,
      insulation: ceilingInsulation,
      hasLedCove: ceilingLedCove,
    };
    addCeiling(ceiling);
    setCeilingName('');
    setCeilingWidth('');
    setCeilingLength('');
    setCeilingDrop('0.10');
    setCeilingBoardType('ST');
    setCeilingInsulation('ninguno');
    setCeilingLedCove(false);
    setShowAddCeiling(false);
  };

  const applyPreset = (width: number, height: number, label: string) => {
    setWallWidth(width.toString());
    setWallHeight(height.toString());
    setWallName(label);
  };

  // Export quote as clean PDF
  const exportPDF = () => {
    if (!currentProject) return;

    try {
      const doc = new jsPDF();
      const margin = 14;
      let y = 20;

      // Header Banner
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('COTIZACIÓN Y METRADO TÉCNICO DRYWALL', margin, 18);

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
      doc.text(`Estado: ${currentProject.status.toUpperCase()}`, margin, y);
      if (currentProject.includePaintFinishing) {
        doc.text('Incluye: Acabado completo de pintura y sellado', 110, y);
      }

      // Section: Measurements summary
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('1. RESUMEN DE ELEMENTOS Y METRADOS', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      currentProject.walls.forEach((w, i) => {
        const gross = w.width * w.height;
        const bLabel = BOARD_TYPES[w.boardType || 'ST'].label;
        const insul = w.insulation && w.insulation !== 'ninguno' ? ` · Aislamiento: ${w.insulation}` : '';
        doc.text(
          `• Tabique ${i + 1} (${w.name}): ${w.width}m × ${w.height}m (${gross.toFixed(2)} m²) · ${bLabel}${insul}`,
          margin + 2,
          y
        );
        y += 5;
      });

      currentProject.ceilings.forEach((c, i) => {
        const area = c.width * c.length;
        const cove = c.hasLedCove ? ' · con Garganta LED' : '';
        doc.text(
          `• Cielo Raso ${i + 1} (${c.name}): ${c.width}m × ${c.length}m (${area.toFixed(2)} m²)${cove}`,
          margin + 2,
          y
        );
        y += 5;
      });

      // Section: Materials Table
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('2. LISTA DETALLADA DE MATERIALES A DESPACHAR', margin, y);
      y += 6;

      // Table Header
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

      currentProject.materials.forEach((mat) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        const nameTruncated = mat.name.length > 50 ? mat.name.substring(0, 47) + '...' : mat.name;
        doc.text(nameTruncated, margin + 2, y);
        doc.text(`${mat.quantity} ${mat.unit}`, 120, y);
        doc.text(`S/ ${mat.unitPrice.toFixed(2)}`, 145, y);
        doc.text(`S/ ${mat.totalPrice.toFixed(2)}`, 170, y);
        y += 5.5;
      });

      // Subtotal Materiales
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal Materiales: S/ ${currentProject.materialsCost.toFixed(2)}`, 120, y);

      // Section: Mano de Obra
      if (laborCosts.includeLabor && currentProject.laborCost > 0) {
        y += 8;
        if (y > 255) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('3. MANO DE OBRA Y SERVICIOS PROFESIONALES', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(`• Estructura metálica, emplacado y masillado a 3 manos`, margin + 4, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`S/ ${currentProject.laborCost.toFixed(2)}`, 170, y);

        if (currentProject.profitAmount > 0) {
          y += 5;
          doc.setFont('helvetica', 'normal');
          doc.text(`• Margen de imprevistos y utilidad (${laborCosts.profitMarginPercent}%):`, margin + 4, y);
          doc.setFont('helvetica', 'bold');
          doc.text(`S/ ${currentProject.profitAmount.toFixed(2)}`, 170, y);
        }
      }

      // Grand Total Box
      y += 8;
      if (y > 255) {
        doc.addPage();
        y = 20;
      }
      doc.setDrawColor(37, 99, 235);
      doc.setFillColor(239, 246, 255);
      doc.rect(95, y, 101, 14, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(29, 78, 216);
      doc.text('TOTAL COTIZACIÓN:', 98, y + 9);
      doc.text(`S/ ${currentProject.totalCost.toFixed(2)}`, 150, y + 9);

      // Save PDF
      doc.save(`Cotizacion_Drywall_${currentProject.name.replace(/\s+/g, '_')}.pdf`);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {
      console.error(e);
      alert('Error al generar el PDF');
    }
  };

  const categoryIcons: Record<string, string> = {
    estructura: '🔩',
    plancha: '📦',
    aislamiento: '🔇',
    acabado: '🎨',
    fijacion: '🔧',
    iluminacion: '💡',
    pintura: '🖌️',
  };

  const categoryLabels: Record<string, string> = {
    estructura: 'Estructura Metálica',
    plancha: 'Planchas de Drywall / Yeso',
    aislamiento: 'Aislamiento Termoacústico',
    acabado: 'Cintas, Masillas y Esquineros',
    fijacion: 'Tornillos y Fulminantes',
    iluminacion: 'Perfiles e Iluminación LED',
    pintura: 'Pintura, Sellador y Lijas',
  };

  if (showNewProject || !currentProject) {
    return (
      <div className="py-6 space-y-4">
        {/* Banner Escanear Dibujo */}
        <button
          onClick={() => setShowScanner(true)}
          className="w-full p-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white rounded-3xl shadow-lg flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-3 text-left">
            <span className="text-3xl">📸</span>
            <div>
              <p className="font-extrabold text-sm sm:text-base">¿Tienes un croquis o dibujo a mano?</p>
              <p className="text-xs text-violet-200">Tómale foto para detectar medidas con IA</p>
            </div>
          </div>
          <span className="bg-white/20 text-white font-bold text-xs px-3 py-1.5 rounded-full">
            Escanear ✨
          </span>
        </button>

        <div className="text-center py-2">
          <span className="text-4xl">📐</span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Nuevo Proyecto de Drywall</h2>
          <p className="text-xs text-slate-500">O ingresa los datos manualmente</p>
        </div>

        <Card className="space-y-4">
          <Input
            label="Nombre del Proyecto / Obra"
            placeholder="Ej: Sala Comedor o Habitación 2"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <Input
            label="Cliente / Contacto"
            placeholder="Nombre del cliente o particular"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <Input
            label="Descripción o Notas"
            placeholder="Ej: Tabique acústico con lana de vidrio y cielo con luz LED"
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
          />
          <Button fullWidth onClick={handleCreateProject}>
            Comenzar a Calcular 🚀
          </Button>
        </Card>

        <SketchScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onSuccess={() => setShowNewProject(false)}
        />
      </div>
    );
  }

  return (
    <div className="py-3 space-y-4">
      {/* Switcher Drywall vs Eléctrico */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl shadow-inner">
        <button className="flex-1 py-2 text-xs font-black rounded-xl bg-white text-blue-700 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200/50">
          <span>🧱</span> Módulo Drywall
        </button>
        <button
          onClick={() => navigate('/electrical')}
          className="flex-1 py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-amber-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>⚡</span> Ir a Eléctrica 220V
        </button>
      </div>

      {/* AI Sketch Scanner Fast Action Banner */}
      <button
        onClick={() => setShowScanner(true)}
        className="w-full py-2.5 px-3 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-2xl shadow-md font-bold text-xs flex items-center justify-between gap-2 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer border border-purple-400"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">📸</span>
          <span className="font-black truncate">Escanear Dibujo con IA</span>
        </div>
        <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
          Foto / Croquis
        </span>
      </button>

      {/* Project Header Bar - Mobile Optimized with 3 Quick Action Buttons */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
        {/* Top: Project Info & "+ Nuevo" */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                Proyecto
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[200px]">
                {currentProject.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {currentProject.client || 'Sin cliente especificado'}
            </p>
          </div>

          <button
            onClick={() => setShowNewProject(true)}
            className="shrink-0 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            + Nuevo
          </button>
        </div>

        {/* Action Buttons: 3 Columns for Mobile & Tablet */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowShareModal(true)}
            title="Pasar este proyecto al celular"
            className="py-2 px-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
          >
            <span>📲</span> QR Celular
          </button>
          <button
            onClick={() => setShowCloudSyncModal(true)}
            title="Sincronizar en la Nube con código"
            className="py-2 px-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
          >
            <span>☁️</span> Nube Sync
          </button>
          <button
            onClick={() => navigate('/viewer3d')}
            className="py-2 px-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-xs text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
          >
            <span>🎨</span> Ver en 3D
          </button>
        </div>
      </div>

      {/* Construction Element Type Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl">
        <button
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'tabiques'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('tabiques')}
        >
          <span>🧱</span> Tabiques & Muros ({currentProject.walls.length})
        </button>
        <button
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'cieloraso'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('cieloraso')}
        >
          <span>⬆️</span> Cielo Raso ({currentProject.ceilings.length})
        </button>
      </div>

      {/* Tabiques Tab */}
      {activeTab === 'tabiques' && (
        <div className="space-y-3">
          {currentProject.walls.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
              <span className="text-3xl">🧱</span>
              <p className="text-sm font-semibold text-slate-700">Aún no has agregado tabiques</p>
              <p className="text-xs text-slate-400">
                Presiona el botón de abajo para ingresar medidas o usa el escáner de foto
              </p>
            </div>
          ) : (
            currentProject.walls.map((wall, index) => {
              const bInfo = BOARD_TYPES[wall.boardType || 'ST'];
              return (
                <Card key={wall.id} className="relative overflow-hidden border-l-4 border-l-blue-600">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                        <h4 className="font-bold text-slate-900 text-sm">{wall.name}</h4>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${bInfo.badge}`}>
                          {bInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {wall.width}m (largo) × {wall.height}m (alto)
                        </span>
                        <span>= {(wall.width * wall.height).toFixed(2)} m²</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                        <span>{wall.hasDoubleSide ? '✅ Doble cara' : '☑️ Una cara'}</span>
                        {wall.insulation && wall.insulation !== 'ninguno' && (
                          <span className="bg-yellow-50 text-yellow-800 border border-yellow-200 px-1.5 py-0.5 rounded font-medium">
                            {INSULATION_TYPES[wall.insulation].label}
                          </span>
                        )}
                        {wall.hasLightNiche && (
                          <span className="bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded font-medium">
                            💡 Nicho con Luz LED
                          </span>
                        )}
                        {wall.openings.length > 0 && (
                          <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                            {wall.openings.length} abertura(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeWall(wall.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </Card>
              );
            })
          )}

          <Button
            fullWidth
            onClick={() => setShowAddWall(true)}
            className="py-3 shadow-md bg-blue-600 hover:bg-blue-700 font-bold"
          >
            + Ingresar Medidas de Tabique
          </Button>
        </div>
      )}

      {/* Cielo Raso Tab */}
      {activeTab === 'cieloraso' && (
        <div className="space-y-3">
          {currentProject.ceilings.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
              <span className="text-3xl">⬆️</span>
              <p className="text-sm font-semibold text-slate-700">Sin techos suspendidos</p>
              <p className="text-xs text-slate-400">
                Agrega las medidas de ancho y largo para calcular falso techo
              </p>
            </div>
          ) : (
            currentProject.ceilings.map((ceiling, index) => {
              const bInfo = BOARD_TYPES[ceiling.boardType || 'ST'];
              return (
                <Card key={ceiling.id} className="relative overflow-hidden border-l-4 border-l-indigo-600">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                        <h4 className="font-bold text-slate-900 text-sm">{ceiling.name}</h4>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${bInfo.badge}`}>
                          {bInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {ceiling.width}m × {ceiling.length}m
                        </span>
                        <span>= {(ceiling.width * ceiling.length).toFixed(2)} m²</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                        <span>Descuelgue: {ceiling.dropHeight}m</span>
                        {ceiling.insulation && ceiling.insulation !== 'ninguno' && (
                          <span className="bg-yellow-50 text-yellow-800 border border-yellow-200 px-1.5 py-0.5 rounded font-medium">
                            {INSULATION_TYPES[ceiling.insulation].label}
                          </span>
                        )}
                        {ceiling.hasLedCove && (
                          <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 px-1.5 py-0.5 rounded font-bold">
                            💡 Garganta Luz LED
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeCeiling(ceiling.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </Card>
              );
            })
          )}

          <Button
            fullWidth
            onClick={() => setShowAddCeiling(true)}
            className="py-3 shadow-md bg-indigo-600 hover:bg-indigo-700 font-bold"
          >
            + Ingresar Medidas de Cielo Raso
          </Button>
        </div>
      )}

      {/* Calculated Materials Section */}
      {currentProject.materials.length > 0 && (
        <div className="space-y-4 pt-2">
          {/* Action Row: Pedido WhatsApp + Exportar PDF */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>📋</span> Materiales Necesarios
              </h3>
              <p className="text-[11px] text-slate-500">Cantidades con 10% de desperdicio técnico</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWhatsAppModal(true)}
                title="Generar pedido para ferretería por WhatsApp"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span>📲</span> Pedir a Ferretería
              </button>
              <button
                onClick={exportPDF}
                title="Descargar presupuesto en PDF"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span>📄</span> PDF
              </button>
            </div>
          </div>

          {/* Categorized Materials Cards */}
          {(['plancha', 'aislamiento', 'estructura', 'fijacion', 'acabado', 'iluminacion', 'pintura'] as const).map((cat) => {
            const catMaterials = currentProject.materials.filter((m) => m.category === cat);
            if (catMaterials.length === 0) return null;
            const subtotal = catMaterials.reduce((acc, m) => acc + m.totalPrice, 0);

            return (
              <div
                key={cat}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{categoryIcons[cat]}</span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {categoryLabels[cat]}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">S/ {subtotal.toFixed(2)}</span>
                </div>

                <div className="divide-y divide-slate-100 p-2">
                  {catMaterials.map((mat) => (
                    <div key={mat.id} className="py-2 px-2 flex items-center justify-between text-xs">
                      <div className="flex-1 pr-2">
                        <p className="font-semibold text-slate-800">{mat.name}</p>
                        {mat.description && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{mat.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded text-xs">
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
            );
          })}

          {/* 🎨 PINTURA Y ACABADO FINAL TOGGLE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎨</span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Incluir Pintura y Acabado Final</h4>
                  <p className="text-[11px] text-slate-500">Sellador/imprimante, pintura látex a 2 manos y lijas</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!currentProject.includePaintFinishing}
                  onChange={(e) => togglePaintFinishing(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* 👷 MANO DE OBRA & PRESUPUESTO INTEGRAL CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">👷</span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Mano de Obra Profesional</h4>
                  <p className="text-[11px] text-slate-500">Instalación, estructura y acabados</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={laborCosts.includeLabor}
                  onChange={(e) => updateLaborCosts({ includeLabor: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {laborCosts.includeLabor && (
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tabiquería (S/ {laborCosts.costPerSqmTabiqueDoble}/m²):</span>
                  <span className="font-semibold text-slate-800">
                    S/ {currentProject.laborCost ? (currentProject.laborCost * 0.6).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Encintado y masillado (S/ {laborCosts.costPerSqmAcabado}/m²):</span>
                  <span className="font-semibold text-slate-800">
                    S/ {currentProject.laborCost ? (currentProject.laborCost * 0.4).toFixed(2) : '0.00'}
                  </span>
                </div>
                {currentProject.includePaintFinishing && (
                  <div className="flex justify-between text-indigo-700">
                    <span>Aplicación de pintura y lijado (S/ {laborCosts.costPerSqmPintura || 8.00}/m²):</span>
                    <span className="font-bold">Incluido en mano de obra</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600 font-medium">Margen imprevistos/utilidad:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={laborCosts.profitMarginPercent}
                      onChange={(e) => updateLaborCosts({ profitMarginPercent: parseFloat(e.target.value) || 0 })}
                      className="w-14 px-2 py-0.5 bg-slate-50 border border-slate-300 rounded text-center text-xs font-bold"
                    />
                    <span className="text-slate-500 font-bold">%</span>
                  </div>
                </div>
                <div className="p-2.5 bg-blue-50/70 rounded-xl flex items-center justify-between text-blue-900 font-bold">
                  <span>Total Mano de Obra:</span>
                  <span>S/ {currentProject.laborCost.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* ⏱️ CRONOGRAMA DE OBRA CARD */}
          <WorkScheduleCard
            project={currentProject}
            onCrewChange={(crew) => setCrewSize(crew)}
          />

          {/* Grand Total Box */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 rounded-2xl shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-blue-200">
              <span>Materiales: S/ {currentProject.materialsCost.toFixed(2)}</span>
              {laborCosts.includeLabor && (
                <span>Mano de Obra: S/ {currentProject.laborCost.toFixed(2)}</span>
              )}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-blue-600/60">
              <div>
                <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">
                  Presupuesto Total Estimado
                </p>
                <p className="text-2xl font-black mt-0.5">S/ {currentProject.totalCost.toFixed(2)}</p>
              </div>
              <button
                onClick={() => navigate('/viewer3d')}
                className="px-4 py-2 bg-white text-blue-800 text-xs font-bold rounded-xl shadow-md hover:bg-blue-50 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ml-2"
              >
                Ver Diseño 3D 🎨
              </button>
            </div>
          </div>

          {/* Interactive Charts */}
          <div className="pt-2 space-y-4">
            <CostChart />
            <MaterialBarChart />
          </div>

          {/* Linked Electrical Budget Banner (Separado de Drywall) */}
          {(currentProject.electricalTotalCost || 0) > 0 && (
            <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200 flex items-center justify-between text-xs shadow-xs">
              <div>
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span>⚡</span> Trabajos Eléctricos Vinculados:
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {currentProject.electricalItems?.length || 0} punto(s) monofásicos · Subtotal: S/ {(currentProject.electricalTotalCost || 0).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => navigate('/electrical')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              >
                Ver Eléctrica ⚡
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Wall */}
      <Modal isOpen={showAddWall} onClose={() => setShowAddWall(false)} title="📐 Ingresar Medidas de Tabique">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Plantillas Rápidas
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(3.0, 2.4, 'División 3×2.4m')}
                className="p-1.5 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium border border-slate-200 cursor-pointer"
              >
                3.0 × 2.4 m
              </button>
              <button
                type="button"
                onClick={() => applyPreset(4.0, 2.4, 'Pared Sala 4×2.4m')}
                className="p-1.5 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium border border-slate-200 cursor-pointer"
              >
                4.0 × 2.4 m
              </button>
              <button
                type="button"
                onClick={() => applyPreset(5.0, 2.6, 'Pared Alta 5×2.6m')}
                className="p-1.5 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium border border-slate-200 cursor-pointer"
              >
                5.0 × 2.6 m
              </button>
            </div>
          </div>

          <Input
            label="Identificador de la Pared"
            placeholder="Ej: Pared lateral derecha"
            value={wallName}
            onChange={(e) => setWallName(e.target.value)}
          />

          {/* Tipo de Construcción */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Tipo de Construcción</label>
            <div className="grid grid-cols-2 gap-2">
              {CONSTRUCTION_TYPES.filter((t) => t.value !== 'cieloraso').map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setWallType(type.value as ConstructionType)}
                  className={`p-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    wallType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="mr-1">{type.icon}</span> {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Placa Especializada */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Tipo de Placa</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(BOARD_TYPES) as BoardType[]).map((bKey) => (
                <button
                  key={bKey}
                  type="button"
                  onClick={() => setWallBoardType(bKey)}
                  className={`p-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    wallBoardType === bKey
                      ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold">{BOARD_TYPES[bKey].label}</p>
                  <p className="text-[10px] text-slate-400 truncate">{BOARD_TYPES[bKey].name.split('(')[1]?.replace(')', '') || ''}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Aislamiento Termoacústico */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Aislamiento Termoacústico</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(INSULATION_TYPES) as InsulationType[]).map((iKey) => (
                <button
                  key={iKey}
                  type="button"
                  onClick={() => setWallInsulation(iKey)}
                  className={`p-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    wallInsulation === iKey
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm">{INSULATION_TYPES[iKey].icon}</span>
                  <span className="font-semibold text-[11px] leading-tight block mt-0.5">
                    {INSULATION_TYPES[iKey].label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Largo / Ancho (m)"
              type="number"
              step="0.01"
              min="0.1"
              placeholder="3.00"
              suffix="m"
              value={wallWidth}
              onChange={(e) => setWallWidth(e.target.value)}
            />
            <Input
              label="Altura (m)"
              type="number"
              step="0.01"
              min="0.1"
              placeholder="2.40"
              suffix="m"
              value={wallHeight}
              onChange={(e) => setWallHeight(e.target.value)}
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Doble Cara (2 lados)</p>
                <p className="text-[11px] text-slate-500">Placas de drywall en ambos lados</p>
              </div>
              <input
                type="checkbox"
                checked={wallDoubleSide}
                onChange={(e) => setWallDoubleSide(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-800">Nicho Decorativo / Centro TV</p>
                <p className="text-[11px] text-slate-500">Incluye perfil y tira LED con luz decorativa</p>
              </div>
              <input
                type="checkbox"
                checked={wallLightNiche}
                onChange={(e) => setWallLightNiche(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Openings Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Aberturas (Puertas / Ventanas)</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => addOpening('puerta')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 font-semibold cursor-pointer"
                >
                  🚪 + Puerta
                </button>
                <button
                  type="button"
                  onClick={() => addOpening('ventana')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 font-semibold cursor-pointer"
                >
                  🪟 + Ventana
                </button>
              </div>
            </div>

            {openings.map((op) => (
              <div
                key={op.id}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
              >
                <span className="font-semibold text-slate-700">
                  {op.type === 'puerta' ? '🚪 Puerta' : '🪟 Ventana'} ({op.width}m × {op.height}m)
                </span>
                <button
                  type="button"
                  onClick={() => removeOpening(op.id)}
                  className="text-red-500 hover:text-red-700 font-bold px-2 py-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <Button fullWidth onClick={handleAddWall} className="py-3 font-bold bg-blue-600">
            Guardar y Calcular Materiales
          </Button>
        </div>
      </Modal>

      {/* Modal: Add Ceiling */}
      <Modal
        isOpen={showAddCeiling}
        onClose={() => setShowAddCeiling(false)}
        title="⬆️ Ingresar Medidas de Cielo Raso"
      >
        <div className="space-y-4">
          <Input
            label="Nombre o Sector"
            placeholder="Ej: Techo Habitación Principal"
            value={ceilingName}
            onChange={(e) => setCeilingName(e.target.value)}
          />

          {/* Tipo de Placa en Techo */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Tipo de Placa</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(BOARD_TYPES) as BoardType[]).map((bKey) => (
                <button
                  key={bKey}
                  type="button"
                  onClick={() => setCeilingBoardType(bKey)}
                  className={`p-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    ceilingBoardType === bKey
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold">{BOARD_TYPES[bKey].label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Aislamiento en Techo */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Aislamiento Termoacústico</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(INSULATION_TYPES) as InsulationType[]).map((iKey) => (
                <button
                  key={iKey}
                  type="button"
                  onClick={() => setCeilingInsulation(iKey)}
                  className={`p-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    ceilingInsulation === iKey
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm">{INSULATION_TYPES[iKey].icon}</span>
                  <span className="font-semibold text-[11px] leading-tight block mt-0.5">
                    {INSULATION_TYPES[iKey].label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ancho (m)"
              type="number"
              step="0.01"
              min="0.1"
              placeholder="3.00"
              suffix="m"
              value={ceilingWidth}
              onChange={(e) => setCeilingWidth(e.target.value)}
            />
            <Input
              label="Largo (m)"
              type="number"
              step="0.01"
              min="0.1"
              placeholder="4.00"
              suffix="m"
              value={ceilingLength}
              onChange={(e) => setCeilingLength(e.target.value)}
            />
          </div>

          <Input
            label="Altura de Descuelgue (m)"
            type="number"
            step="0.01"
            min="0.05"
            placeholder="0.10"
            suffix="m"
            value={ceilingDrop}
            onChange={(e) => setCeilingDrop(e.target.value)}
          />

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Garganta Perimetral para Luz Indirecta LED</p>
                <p className="text-[11px] text-slate-500">Cajón perimetral con perfil de aluminio difusor y tira LED</p>
              </div>
              <input
                type="checkbox"
                checked={ceilingLedCove}
                onChange={(e) => setCeilingLedCove(e.target.checked)}
                className="w-5 h-5 accent-cyan-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <Button fullWidth onClick={handleAddCeiling} className="py-3 font-bold bg-indigo-600">
            Guardar y Calcular Cielo Raso
          </Button>
        </div>
      </Modal>

      {/* AI Sketch Scanner Modal */}
      <SketchScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
      />

      {/* Share to Phone Modal (QR & Link) */}
      <ShareProjectModal
        project={currentProject}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* WhatsApp Hardware Order Modal */}
      <WhatsAppOrderModal
        project={currentProject}
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
      />

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        project={currentProject}
        isOpen={showCloudSyncModal}
        onClose={() => setShowCloudSyncModal(false)}
      />
    </div>
  );
}
