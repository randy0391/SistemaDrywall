import { useState, useRef } from 'react';
import type { MouseEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/useProjectStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import ShareProjectModal from '../components/projects/ShareProjectModal';
import type { Project } from '../types';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, createProject, deleteProject, setCurrentProject, importFromSketch } = useProjectStore();
  const [showNewModal, setShowNewModal] = useState(false);
  const [projectToShare, setProjectToShare] = useState<Project | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [desc, setDesc] = useState('');

  const sorted = [...projects].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const statusColors: Record<string, string> = {
    borrador: 'bg-slate-100 text-slate-600',
    cotizado: 'bg-blue-100 text-blue-600',
    aprobado: 'bg-green-100 text-green-600',
    en_proceso: 'bg-yellow-100 text-yellow-600',
    completado: 'bg-emerald-100 text-emerald-600',
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
    createProject(name, client, desc);
    setShowNewModal(false);
    setName('');
    setClient('');
    setDesc('');
    navigate('/calculator');
  };

  const handleSelect = (id: string) => {
    setCurrentProject(id);
    navigate('/calculator');
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
        if (parsed.walls) {
          importFromSketch(parsed.walls, parsed.ceilings || [], parsed.sketchImage, parsed.name);
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
    <div className="py-4 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mis Proyectos</h2>
          <p className="text-xs text-slate-500">Guardados localmente en este dispositivo</p>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar archivo .drywall"
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-1 cursor-pointer"
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

          <Button size="sm" onClick={() => setShowNewModal(true)} icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          }>
            Nuevo
          </Button>
        </div>
      </div>

      {/* Helpful sync hint */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
        <span className="text-base">💡</span>
        <div>
          <p className="font-bold">¿Cómo pasar un proyecto a tu celular?</p>
          <p className="text-[11px] text-blue-700 mt-0.5">
            Toca el botón <strong>&quot;📲 Pasar a Celular&quot;</strong> en cualquier proyecto para escanear el código QR con tu teléfono o enviarte el enlace por WhatsApp.
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl">📂</span>
          <p className="text-slate-500 mt-4 font-semibold">No hay proyectos aún</p>
          <p className="text-sm text-slate-400 mt-1">Crea tu primer proyecto para comenzar</p>
          <Button className="mt-4" onClick={() => setShowNewModal(true)}>Crear Proyecto</Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map(project => (
            <Card key={project.id} onClick={() => handleSelect(project.id)}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{project.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{project.client || 'Sin cliente'}</p>
                  
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {project.walls.length} tabiques · {project.ceilings.length} techos
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 ml-2">
                  <p className="text-sm font-black text-blue-600">S/ {project.totalCost.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400">{new Date(project.updatedAt).toLocaleDateString('es-PE')}</p>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={(e) => handleShare(e, project)}
                      title="Pasar al celular con Código QR o enlace"
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>📲</span> Enviar
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, project.id)}
                      title="Eliminar proyecto"
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: New Project */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Nuevo Proyecto">
        <div className="space-y-4">
          <Input label="Nombre del Proyecto *" placeholder="Ej: Departamento 301" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Cliente" placeholder="Nombre del cliente" value={client} onChange={e => setClient(e.target.value)} />
          <Input label="Descripción" placeholder="Breve descripción" value={desc} onChange={e => setDesc(e.target.value)} />
          <Button fullWidth onClick={handleCreate}>Crear Proyecto</Button>
        </div>
      </Modal>

      {/* Modal: Share to Phone QR */}
      <ShareProjectModal
        project={projectToShare}
        isOpen={!!projectToShare}
        onClose={() => setProjectToShare(null)}
      />
    </div>
  );
}
