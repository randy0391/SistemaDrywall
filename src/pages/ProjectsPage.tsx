import { useState, useRef } from 'react';
import type { MouseEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/useProjectStore';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import ShareProjectModal from '../components/projects/ShareProjectModal';
import type { Project, ProjectType } from '../types';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const {
    projects,
    createProject,
    deleteProject,
    setCurrentProject,
    setCurrentElectricalProject,
    importFromSketch,
  } = useProjectStore();

  const [filterType, setFilterType] = useState<'all' | 'drywall' | 'electrico' | 'mixto'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [projectToShare, setProjectToShare] = useState<Project | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Project Form
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType>('drywall');

  const sorted = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const filtered = sorted.filter((p) => {
    if (filterType === 'all') return true;
    if (filterType === 'drywall') {
      return p.projectType === 'drywall' || (!p.projectType && p.walls && p.walls.length > 0 && (!p.electricalItems || p.electricalItems.length === 0));
    }
    if (filterType === 'electrico') {
      return p.projectType === 'electrico' || (!p.projectType && (!p.walls || p.walls.length === 0) && (p.electricalItems?.length || 0) > 0);
    }
    if (filterType === 'mixto') {
      return p.projectType === 'mixto' || (p.walls && p.walls.length > 0 && (p.electricalItems?.length || 0) > 0);
    }
    return true;
  });

  const statusColors: Record<string, string> = {
    borrador: 'bg-slate-100 text-slate-600',
    cotizado: 'bg-blue-100 text-blue-700',
    aprobado: 'bg-green-100 text-green-700',
    en_proceso: 'bg-amber-100 text-amber-700',
    completado: 'bg-emerald-100 text-emerald-700',
  };

  const statusLabels: Record<string, string> = {
    borrador: 'Borrador',
    cotizado: 'Cotizado',
    aprobado: 'Aprobado',
    en_proceso: 'En Proceso',
    completado: 'Completado',
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const newProj = createProject(name, client, desc, selectedProjectType);
    setShowNewModal(false);
    setName('');
    setClient('');
    setDesc('');

    if (selectedProjectType === 'electrico') {
      setCurrentElectricalProject(newProj.id);
      navigate('/electrical');
    } else {
      setCurrentProject(newProj.id);
      navigate('/calculator');
    }
  };

  const handleOpenDrywall = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    setCurrentProject(id);
    navigate('/calculator');
  };

  const handleOpenElectrical = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    setCurrentElectricalProject(id);
    navigate('/electrical');
  };

  const handleDelete = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('¿Eliminar este proyecto?')) {
      deleteProject(id);
    }
  };

  const handleShare = (e: MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToShare(project);
  };

  // Import backup file (.drywall / .json)
  const handleFileImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.walls || parsed.electricalItems) {
          importFromSketch(parsed.walls || [], parsed.ceilings || [], parsed.sketchImage, parsed.name);
          alert(`¡Proyecto "${parsed.name || 'Importado'}" restaurado exitosamente!`);
        }
      } catch (err) {
        console.error(err);
        alert('Archivo no válido o dañado.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="py-2 space-y-4 max-w-lg mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Mis Proyectos</h2>
          <p className="text-xs text-slate-500">Historial de cotizaciones guardadas</p>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar archivo"
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            📥 Importar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".drywall,.json"
            onChange={handleFileImport}
            className="hidden"
          />

          <Button
            size="sm"
            onClick={() => setShowNewModal(true)}
            className="bg-blue-600 hover:bg-blue-700 font-bold"
          >
            + Nuevo
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            filterType === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
          }`}
        >
          Todos ({sorted.length})
        </button>
        <button
          onClick={() => setFilterType('drywall')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            filterType === 'drywall'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
          }`}
        >
          🧱 Solo Drywall
        </button>
        <button
          onClick={() => setFilterType('electrico')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            filterType === 'electrico'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
          }`}
        >
          ⚡ Solo Eléctrico
        </button>
        <button
          onClick={() => setFilterType('mixto')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            filterType === 'mixto'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
          }`}
        >
          🔄 Mixtos
        </button>
      </div>

      {/* Helpful sync hint */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-blue-950 shadow-xs">
        <span className="text-base shrink-0">📲</span>
        <div>
          <p className="font-bold">¿Cómo pasar tus proyectos al celular?</p>
          <p className="text-[11px] text-blue-800 mt-0.5">
            Presiona <strong>&quot;QR Celular&quot;</strong> en cualquier proyecto para escanearlo con la cámara de tu teléfono o mandártelo por WhatsApp al instante.
          </p>
        </div>
      </div>

      {/* Projects List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
          <span className="text-4xl">📂</span>
          <p className="text-slate-700 font-bold text-sm">No hay proyectos en esta categoría</p>
          <p className="text-xs text-slate-400">Presiona "+ Nuevo" para iniciar una cotización</p>
          <Button className="mt-2 bg-blue-600" onClick={() => setShowNewModal(true)}>
            Crear Proyecto
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => {
            const hasDrywall = project.walls && project.walls.length > 0;
            const hasElectric = project.electricalItems && project.electricalItems.length > 0;
            const isElecOnly = project.projectType === 'electrico' || (!hasDrywall && hasElectric);
            const isMixed = project.projectType === 'mixto' || (hasDrywall && hasElectric);

            const initials = (project.client || project.name)
              .split(' ')
              .map((w) => w[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();

            return (
              <div
                key={project.id}
                onClick={() =>
                  isElecOnly
                    ? (setCurrentElectricalProject(project.id), navigate('/electrical'))
                    : (setCurrentProject(project.id), navigate('/calculator'))
                }
                className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all cursor-pointer space-y-3 active:scale-[0.99]"
              >
                {/* Top Row: Client Avatar, Title, Status & Price */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isElecOnly
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isMixed
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{project.name}</h4>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isElecOnly
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : isMixed
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isElecOnly ? '⚡ Solo Eléctrico' : isMixed ? '🔄 Mixto' : '🧱 Solo Drywall'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {project.client ? `Cliente: ${project.client}` : 'Sin cliente'} · {new Date(project.updatedAt).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">
                      S/ {(isElecOnly ? project.electricalTotalCost || 0 : project.totalCost).toFixed(2)}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                        statusColors[project.status]
                      }`}
                    >
                      {statusLabels[project.status]}
                    </span>
                  </div>
                </div>

                {/* Middle Info Row */}
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap">
                  {hasDrywall && (
                    <span className="bg-slate-50 px-2 py-0.5 rounded-md font-medium text-[11px]">
                      🧱 {project.walls.length} tabique(s) · {project.ceilings.length} techo(s)
                    </span>
                  )}
                  {hasElectric && (
                    <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold text-[11px] border border-amber-200">
                      ⚡ {project.electricalItems?.length || 0} punto(s) eléctricos
                    </span>
                  )}
                  {isMixed && (
                    <span className="text-[11px] text-purple-700 font-semibold">
                      Total combinado: S/ {(project.totalCost + (project.electricalTotalCost || 0)).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-1.5">
                    {hasDrywall && (
                      <button
                        onClick={(e) => handleOpenDrywall(e, project.id)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-blue-200"
                      >
                        Abrir Drywall 🧱
                      </button>
                    )}
                    {hasElectric && (
                      <button
                        onClick={(e) => handleOpenElectrical(e, project.id)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-amber-300"
                      >
                        Abrir Eléctrica ⚡
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleShare(e, project)}
                      title="Pasar al celular con Código QR"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer text-xs font-bold"
                    >
                      📲 QR
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      title="Eliminar proyecto"
                      className="p-1.5 text-slate-300 hover:text-red-500 rounded-xl transition-colors cursor-pointer text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Project with Type Choice */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="✨ Nuevo Presupuesto de Obra">
        <div className="space-y-4">
          <Input
            label="Nombre del Proyecto"
            placeholder="Ej: Casa Los Álamos o Habitación Principal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Cliente / Contacto"
            placeholder="Nombre del cliente o departamento"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />

          {/* Type Choice */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">¿Qué tipo de trabajo cotizarás?</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedProjectType('drywall')}
                className={`p-2.5 rounded-2xl border text-center text-xs transition-all cursor-pointer ${
                  selectedProjectType === 'drywall'
                    ? 'border-blue-500 bg-blue-50/80 text-blue-900 font-black shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-xl block">🧱</span>
                <span className="font-bold text-[11px] block mt-1">Solo Drywall</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProjectType('electrico')}
                className={`p-2.5 rounded-2xl border text-center text-xs transition-all cursor-pointer ${
                  selectedProjectType === 'electrico'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-black shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-xl block">⚡</span>
                <span className="font-bold text-[11px] block mt-1">Solo Eléctrico</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProjectType('mixto')}
                className={`p-2.5 rounded-2xl border text-center text-xs transition-all cursor-pointer ${
                  selectedProjectType === 'mixto'
                    ? 'border-purple-500 bg-purple-50/80 text-purple-900 font-black shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-xl block">🔄</span>
                <span className="font-bold text-[11px] block mt-1">Mixto Ambos</span>
              </button>
            </div>
          </div>

          <Input
            label="Descripción o Notas"
            placeholder="Ej: Tabiques acústicos y cableado general de tomacorrientes"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          <Button fullWidth onClick={handleCreate} className="py-3 font-bold bg-blue-600 hover:bg-blue-700">
            Crear y Comenzar a Cotizar 🚀
          </Button>
        </div>
      </Modal>

      {/* Share Modal */}
      <ShareProjectModal
        project={projectToShare}
        isOpen={Boolean(projectToShare)}
        onClose={() => setProjectToShare(null)}
      />
    </div>
  );
}
