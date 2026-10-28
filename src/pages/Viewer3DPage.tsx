import DrywallScene from '../components/viewer3d/DrywallScene';
import { useProjectStore } from '../stores/useProjectStore';
import { useNavigate } from 'react-router-dom';

export default function Viewer3DPage() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-lg mx-auto py-2">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🎨</span> Diseñador 3D Drywall
          </h2>
          <p className="text-xs text-slate-500">
            {currentProject
              ? `${currentProject.name} (${currentProject.walls.length} tabiques, ${currentProject.ceilings.length} techos)`
              : 'Modo demostración'}
          </p>
        </div>

        <button
          onClick={() => navigate('/calculator')}
          className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200 cursor-pointer"
        >
          {currentProject ? 'Modificar Medidas ✏️' : 'Ingresar Medidas 📐'}
        </button>
      </div>

      {/* 3D Scene Viewport */}
      <div className="flex-1 w-full min-h-[360px] relative">
        <DrywallScene />
      </div>

      {/* Info Badge */}
      <div className="mt-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Modelo 3D calculado a escala 1:1</span>
        </div>
        <div className="font-semibold text-slate-800">
          {currentProject?.totalCost ? `S/ ${currentProject.totalCost.toFixed(2)}` : 'S/ 0.00'}
        </div>
      </div>
    </div>
  );
}
