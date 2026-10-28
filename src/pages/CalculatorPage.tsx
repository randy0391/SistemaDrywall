import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/useProjectStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import CostChart from '../components/charts/CostChart';
import MaterialBarChart from '../components/charts/MaterialBarChart';
import type { WallMeasurement, CeilingMeasurement, Opening, ConstructionType } from '../types';
import { CONSTRUCTION_TYPES } from '../utils/constants';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export default function CalculatorPage() {
  const navigate = useNavigate();
  const { currentProject, createProject, addWall, removeWall, addCeiling, removeCeiling } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'tabiques' | 'cieloraso'>('tabiques');
  const [showNewProject, setShowNewProject] = useState(!currentProject);
  const [showAddWall, setShowAddWall] = useState(false);
  const [showAddCeiling, setShowAddCeiling] = useState(false);

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
  const [openings, setOpenings] = useState<Opening[]>([]);

  // Ceiling form
  const [ceilingName, setCeilingName] = useState('');
  const [ceilingWidth, setCeilingWidth] = useState('');
  const [ceilingLength, setCeilingLength] = useState('');
  const [ceilingDrop, setCeilingDrop] = useState('0.10');

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
      openings,
    };
    addWall(wall);
    setWallName('');
    setWallWidth('');
    setWallHeight('2.40');
    setWallType('tabique');
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
    };
    addCeiling(ceiling);
    setCeilingName('');
    setCeilingWidth('');
    setCeilingLength('');
    setCeilingDrop('0.10');
    setShowAddCeiling(false);
  };

  // Preset quick templates
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
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('COTIZACIÓN DE MATERIALES - DRYWALL', margin, 18);

      // Project Info
      y = 38;
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Proyecto: ${currentProject.name}`, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Cliente: ${currentProject.client || 'Particular'}`, margin, y);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 140, y);
      y += 6;
      doc.text(`Estado: ${currentProject.status.toUpperCase()}`, margin, y);

      // Section: Measurements summary
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('1. RESUMEN DE MEDIDAS INGRESADAS', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      currentProject.walls.forEach((w) => {
        doc.text(
          `• ${w.name}: ${w.width}m largo × ${w.height}m alto (${(w.width * w.height).toFixed(2)} m²) - ${w.hasDoubleSide ? 'Doble cara' : 'Una cara'} - ${w.openings.length} aberturas`,
          margin + 4,
          y
        );
        y += 5;
      });

      currentProject.ceilings.forEach((c) => {
        doc.text(
          `• Cielo Raso: ${c.name} - ${c.width}m × ${c.length}m (${(c.width * c.length).toFixed(2)} m²) - Descuelgue: ${c.dropHeight}m`,
          margin + 4,
          y
        );
        y += 5;
      });

      // Section: Materials Table
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. LISTA DETALLADA DE MATERIALES A USAR', margin, y);
      y += 6;

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, 182, 7, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Descripción del Material', margin + 2, y + 5);
      doc.text('Cant.', 120, y + 5);
      doc.text('P. Unit', 145, y + 5);
      doc.text('Total (S/)', 170, y + 5);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      currentProject.materials.forEach((mat) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(mat.name, margin + 2, y);
        doc.text(`${mat.quantity} ${mat.unit}`, 120, y);
        doc.text(`S/ ${mat.unitPrice.toFixed(2)}`, 145, y);
        doc.text(`S/ ${mat.totalPrice.toFixed(2)}`, 170, y);
        y += 6;
      });

      // Total Box
      y += 4;
      doc.setDrawColor(37, 99, 235);
      doc.setFillColor(239, 246, 255);
      doc.rect(115, y, 81, 12, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(29, 78, 216);
      doc.text('TOTAL ESTIMADO:', 120, y + 8);
      doc.text(`S/ ${currentProject.totalCost.toFixed(2)}`, 165, y + 8);

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
    acabado: '🎨',
    fijacion: '🔧',
  };

  const categoryLabels: Record<string, string> = {
    estructura: 'Estructura Metálica',
    plancha: 'Planchas de Yeso / Drywall',
    acabado: 'Cintas, Masillas y Esquineros',
    fijacion: 'Tornillos y Fulminantes',
  };

  if (showNewProject || !currentProject) {
    return (
      <div className="py-6 space-y-4">
        <div className="text-center py-2">
          <span className="text-4xl">📐</span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Nuevo Proyecto de Drywall</h2>
          <p className="text-xs text-slate-500">Ingresa los datos para empezar a calcular</p>
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
            placeholder="Ej: Tabique acústico con lana de vidrio"
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
          />
          <Button fullWidth onClick={handleCreateProject}>
            Comenzar a Calcular 🚀
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-3 space-y-4">
      {/* Project Header Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Proyecto
            </span>
            <h2 className="text-base font-bold text-slate-900 truncate max-w-[180px]">
              {currentProject.name}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{currentProject.client || 'Sin cliente especificado'}</p>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => navigate('/viewer3d')}
            className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-sm text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
          >
            <span>🎨</span> 3D
          </button>
          <Button variant="secondary" size="sm" onClick={() => setShowNewProject(true)}>
            + Nuevo
          </Button>
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
                Presiona el botón de abajo para ingresar las medidas de tu primera pared
              </p>
            </div>
          ) : (
            currentProject.walls.map((wall, index) => (
              <Card key={wall.id} className="relative overflow-hidden border-l-4 border-l-blue-600">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{wall.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {wall.width}m (largo) × {wall.height}m (alto)
                      </span>
                      <span>= {(wall.width * wall.height).toFixed(2)} m²</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{wall.hasDoubleSide ? '✅ Doble cara' : '☑️ Una cara'}</span>
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
            ))
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
            currentProject.ceilings.map((ceiling, index) => (
              <Card key={ceiling.id} className="relative overflow-hidden border-l-4 border-l-indigo-600">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{ceiling.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {ceiling.width}m × {ceiling.length}m
                      </span>
                      <span>= {(ceiling.width * ceiling.length).toFixed(2)} m²</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Descuelgue: {ceiling.dropHeight}m</p>
                  </div>

                  <button
                    onClick={() => removeCeiling(ceiling.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </Card>
            ))
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>📋</span> Materiales Necesarios
              </h3>
              <p className="text-[11px] text-slate-500">Cantidades con 10% de desperdicio técnico</p>
            </div>

            <button
              onClick={exportPDF}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <span>📄</span> Exportar PDF
            </button>
          </div>

          {(['estructura', 'plancha', 'acabado', 'fijacion'] as const).map((cat) => {
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

          {/* Grand Total Box */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">
                Presupuesto Total Estimado
              </p>
              <p className="text-2xl font-black mt-0.5">S/ {currentProject.totalCost.toFixed(2)}</p>
            </div>
            <button
              onClick={() => navigate('/viewer3d')}
              className="px-4 py-2 bg-white text-blue-800 text-xs font-bold rounded-xl shadow-md hover:bg-blue-50 transition-all active:scale-95 cursor-pointer"
            >
              Ver Diseño 3D 🎨
            </button>
          </div>

          {/* Interactive Charts */}
          <div className="pt-2 space-y-4">
            <CostChart />
            <MaterialBarChart />
          </div>
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

          <Button fullWidth onClick={handleAddCeiling} className="py-3 font-bold bg-indigo-600">
            Guardar y Calcular Cielo Raso
          </Button>
        </div>
      </Modal>
    </div>
  );
}
