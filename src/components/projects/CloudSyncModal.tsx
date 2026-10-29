import { useState } from 'react';
import type { Project } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { uploadProjectToCloud, downloadProjectFromCloud } from '../../utils/cloudSync';
import { useProjectStore } from '../../stores/useProjectStore';
import confetti from 'canvas-confetti';

interface CloudSyncModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CloudSyncModal({ project, isOpen, onClose }: CloudSyncModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'download'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [syncCode, setSyncCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [cloudUrl, setCloudUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { setCurrentProject, recalculate } = useProjectStore();

  const handleUpload = async () => {
    if (!project) return;
    setIsUploading(true);
    setErrorMsg('');
    const res = await uploadProjectToCloud(project);
    setIsUploading(false);

    if (res.success && res.code) {
      setSyncCode(res.code);
      setCloudUrl(res.url || '');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } else {
      setErrorMsg(res.error || 'No se pudo subir a la nube. Intenta nuevamente.');
    }
  };

  const handleDownload = async () => {
    if (!inputCode.trim()) {
      setErrorMsg('Por favor ingresa el código o enlace');
      return;
    }
    setIsDownloading(true);
    setErrorMsg('');
    const downloaded = await downloadProjectFromCloud(inputCode.trim());
    setIsDownloading(false);

    if (downloaded) {
      useProjectStore.setState((state) => {
        const existingIdx = state.projects.findIndex((p) => p.id === downloaded.id);
        const updatedProjects = existingIdx >= 0
          ? state.projects.map((p) => (p.id === downloaded.id ? downloaded : p))
          : [...state.projects, downloaded];

        return {
          projects: updatedProjects,
          currentProject: downloaded,
        };
      });

      setCurrentProject(downloaded.id);
      recalculate();

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      alert(`¡Proyecto "${downloaded.name}" sincronizado con éxito en tu dispositivo!`);
      onClose();
    } else {
      setErrorMsg('No se encontró el proyecto con ese código. Verifica el código e intenta de nuevo.');
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Error al copiar el código');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="☁️ Sincronización en la Nube Multi-Dispositivo">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('upload'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ☁️ Subir Proyecto
          </button>
          <button
            onClick={() => { setActiveTab('download'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'download'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📥 Descargar con Código
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Sube el proyecto actual a la nube para abrirlo en tu celular o en otra computadora sin cables.
            </p>

            {project ? (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-blue-900 truncate">
                  Proyecto: {project.name}
                </p>
                <p className="text-blue-700">
                  {project.walls.length} tabique(s) · {project.ceilings.length} cielo(s) raso(s) · Presupuesto: S/ {project.totalCost.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-amber-600">No hay ningún proyecto activo.</p>
            )}

            {syncCode ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2">
                <span className="text-2xl">🎉</span>
                <p className="text-xs font-bold text-emerald-800">¡Proyecto subido a la nube!</p>
                <p className="text-xs text-slate-500">Usa este código en tu celular para descargarlo:</p>

                <div className="inline-block p-2.5 px-4 bg-white border-2 border-emerald-500 rounded-xl text-emerald-800 font-mono text-base font-black tracking-wider shadow-xs select-all">
                  {syncCode}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={copyCode}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    {copied ? '✅ ¡Copiado!' : '📋 Copiar Código'}
                  </button>
                  {cloudUrl && (
                    <a
                      href={cloudUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center cursor-pointer"
                    >
                      Ver JSON ↗
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <Button
                fullWidth
                onClick={handleUpload}
                disabled={isUploading || !project}
                className="py-3 bg-blue-600 hover:bg-blue-700 font-bold"
              >
                {isUploading ? 'Subiendo a la nube...' : '☁️ Subir y Generar Código'}
              </Button>
            )}
          </div>
        )}

        {/* Download Tab */}
        {activeTab === 'download' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Ingresa el código o enlace que generaste en tu computadora o en otro dispositivo para cargarlo aquí:
            </p>

            <Input
              label="Código de Proyecto o Enlace Cloud"
              placeholder="Ej: DW-4921 o código ID"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
            />

            <Button
              fullWidth
              onClick={handleDownload}
              disabled={isDownloading || !inputCode.trim()}
              className="py-3 bg-indigo-600 hover:bg-indigo-700 font-bold"
            >
              {isDownloading ? 'Buscando y descargando...' : '📥 Descargar Proyecto'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
