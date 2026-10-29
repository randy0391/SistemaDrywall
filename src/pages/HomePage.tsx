import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/useProjectStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { projects, setCurrentProject, setCurrentElectricalProject } = useProjectStore();

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const drywallCount = projects.filter((p) => p.projectType !== 'electrico' && p.walls.length > 0).length;
  const electricalCount = projects.filter((p) => (p.electricalItems && p.electricalItems.length > 0) || p.projectType === 'electrico').length;

  const handleOpenDrywallProject = (id: string) => {
    setCurrentProject(id);
    navigate('/calculator');
  };

  const handleOpenElectricalProject = (id: string) => {
    setCurrentElectricalProject(id);
    navigate('/electrical');
  };

  return (
    <div className="py-2 space-y-5 max-w-lg mx-auto">
      {/* Top Greeting & Status Banner */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
            PRO V2.5 · SISTEMA PROFESIONAL
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
            Hola, Maestro Constructor 👷‍♂️
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cotizaciones exactas de drywall e instalaciones eléctricas monofásicas.
          </p>
        </div>
      </div>

      {/* DUAL HERO ENGINE CARDS */}
      <div className="space-y-3.5">
        {/* CARD 1: SISTEMA DRYWALL */}
        <div
          onClick={() => navigate('/calculator')}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white p-5 shadow-xl shadow-blue-950/20 border border-blue-500/20 cursor-pointer active:scale-[0.99] transition-all group"
        >
          {/* Decorative glowing gradient sphere */}
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl p-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/15">
                🧱
              </span>
              <span className="text-[10px] font-black tracking-wider uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2.5 py-1 rounded-full">
                Módulo Drywall & 3D
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                Tabiquería y Cielos Rasos
              </h3>
              <p className="text-xs text-blue-200/80 mt-1 leading-relaxed">
                Placas ST, RH Verde, RF Cortafuego y Superboard. Estructuras, masillas y diseño 3D interactivo.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-0.5 rounded-md">
                📸 Escáner IA
              </span>
              <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-0.5 rounded-md">
                🎨 Visor 3D
              </span>
              <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-0.5 rounded-md">
                🔇 Aislamiento Acústico
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs font-bold text-blue-300">
              <span>Cotizar Tabiques & Techos</span>
              <span className="text-white group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </div>
        </div>

        {/* CARD 2: SISTEMA ELÉCTRICO MONOFÁSICO 220V */}
        <div
          onClick={() => navigate('/electrical')}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-amber-950 to-orange-950 text-white p-5 shadow-xl shadow-amber-950/20 border border-amber-500/30 cursor-pointer active:scale-[0.99] transition-all group"
        >
          {/* Decorative glowing gradient sphere */}
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-amber-500/25 rounded-full blur-2xl group-hover:bg-amber-500/35 transition-all pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl p-2 bg-amber-500/20 rounded-2xl backdrop-blur-md border border-amber-400/20">
                ⚡
              </span>
              <span className="text-[10px] font-black tracking-wider uppercase bg-amber-500/25 text-amber-200 border border-amber-400/30 px-2.5 py-1 rounded-full">
                Módulo Eléctrico 220V
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                Instalaciones Monofásicas
              </h3>
              <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                Puntos de tomacorrientes 2P+T, conexiones conmutadas (escalera), centros de luz y tableros.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold bg-amber-400/15 text-amber-200 px-2 py-0.5 rounded-md">
                🔌 Tomacorrientes
              </span>
              <span className="text-[10px] font-bold bg-amber-400/15 text-amber-200 px-2 py-0.5 rounded-md">
                🔄 Conmutados 3-Way
              </span>
              <span className="text-[10px] font-bold bg-amber-400/15 text-amber-200 px-2 py-0.5 rounded-md">
                ⚡ Tableros Monofásicos
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs font-bold text-amber-300">
              <span>Cotizar Trabajos Eléctricos</span>
              <span className="text-white group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 text-center shadow-xs">
          <p className="text-xl font-black text-slate-900">{projects.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Total Obras</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-blue-200/60 text-center shadow-xs">
          <p className="text-xl font-black text-blue-600">{drywallCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mt-0.5">Drywall</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-amber-200/60 text-center shadow-xs">
          <p className="text-xl font-black text-amber-700">{electricalCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mt-0.5">Eléctricas</p>
        </div>
      </div>

      {/* Quick Tools Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Herramientas Rápidas
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/calculator')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left flex items-center gap-3 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
              📸
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-tight">Escáner IA</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Foto de croquis</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/viewer3d')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left flex items-center gap-3 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
              🎨
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-tight">Visor 3D</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Girar y dimensionar</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/projects')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left flex items-center gap-3 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
              📲
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-tight">QR Celular</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Compartir obras</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left flex items-center gap-3 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
              ⚙️
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-tight">Tarifas</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Precios y mano obra</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Projects Showcase */}
      {recentProjects.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Proyectos Recientes
            </h3>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Ver todos ({projects.length}) ➔
            </button>
          </div>

          <div className="space-y-2">
            {recentProjects.map((p) => {
              const isOnlyElectric = p.projectType === 'electrico' || (p.walls.length === 0 && (p.electricalItems?.length || 0) > 0);
              const isMixed = p.projectType === 'mixto' || (p.walls.length > 0 && (p.electricalItems?.length || 0) > 0);

              return (
                <div
                  key={p.id}
                  onClick={() => isOnlyElectric ? handleOpenElectricalProject(p.id) : handleOpenDrywallProject(p.id)}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 font-bold ${
                        isOnlyElectric
                          ? 'bg-amber-100 text-amber-800'
                          : isMixed
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isOnlyElectric ? '⚡' : isMixed ? '🔄' : '🧱'}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{p.name}</h4>
                      <p className="text-xs text-slate-400 truncate">
                        {p.client || 'Particular'} · {new Date(p.updatedAt).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 block">
                      S/ {(isOnlyElectric ? p.electricalTotalCost || 0 : p.totalCost).toFixed(2)}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        isOnlyElectric
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : isMixed
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {isOnlyElectric ? 'Eléctrico' : isMixed ? 'Mixto' : 'Drywall'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
