import type { Project, CrewSize } from '../../types';
import { calculateWorkSchedule } from '../../utils/calculations';
import { CREW_CONFIGS } from '../../utils/constants';

interface WorkScheduleCardProps {
  project: Project;
  onCrewChange: (crew: CrewSize) => void;
}

export default function WorkScheduleCard({ project, onCrewChange }: WorkScheduleCardProps) {
  const currentCrew: CrewSize = project.crewSize || '1_maestro_1_ayudante';
  const schedule = calculateWorkSchedule(
    project.walls,
    project.ceilings,
    currentCrew,
    project.includePaintFinishing
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏱️</span>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Cronograma de Obra y Plazos</h4>
            <p className="text-[11px] text-slate-500">Estimación de días hábiles de trabajo</p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-black">
          {schedule.totalDays} {schedule.totalDays === 1 ? 'Día' : 'Días hábiles'}
        </span>
      </div>

      {/* Crew Selector */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
          Tamaño de Cuadrilla
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {(Object.keys(CREW_CONFIGS) as CrewSize[]).map((cKey) => {
            const isSelected = currentCrew === cKey;
            return (
              <button
                key={cKey}
                type="button"
                onClick={() => onCrewChange(cKey)}
                className={`p-2 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/80 text-blue-900 font-bold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <p className="font-bold leading-tight truncate">{CREW_CONFIGS[cKey].label.split('(')[0]}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{CREW_CONFIGS[cKey].description.split('.')[0]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Breakdown Progress Bars */}
      <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 flex items-center gap-1.5">
            <span>🔩</span> Estructura metálica (parantes y rieles):
          </span>
          <span className="font-bold text-slate-900">{schedule.structureDays} día(s)</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-600 flex items-center gap-1.5">
            <span>📦</span> Emplacado y atornillado:
          </span>
          <span className="font-bold text-slate-900">{schedule.sheetingDays} día(s)</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-600 flex items-center gap-1.5">
            <span>🎨</span> Cinta, 3 manos masilla y secado:
          </span>
          <span className="font-bold text-slate-900">{schedule.muddingDays} día(s)</span>
        </div>

        {project.includePaintFinishing && (
          <div className="flex items-center justify-between text-indigo-700">
            <span className="flex items-center gap-1.5 font-medium">
              <span>🖌️</span> Sellador y 2 manos de pintura:
            </span>
            <span className="font-bold">{schedule.paintingDays} día(s)</span>
          </div>
        )}

        {/* Delivery Date Highlight */}
        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs mt-2">
          <div>
            <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
              Fecha estimada de entrega al cliente
            </p>
            <p className="font-extrabold text-amber-950 text-sm capitalize">
              {schedule.estimatedCompletionDate}
            </p>
          </div>
          <span className="text-2xl">🏁</span>
        </div>
      </div>
    </div>
  );
}
