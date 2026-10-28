import { useProjectStore } from '../../stores/useProjectStore';
import { getMaterialsByCategory } from '../../utils/calculations';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; fill: string }> = {
  estructura: { bg: 'bg-slate-100', text: 'text-slate-700', fill: '#64748b' },
  plancha: { bg: 'bg-blue-100', text: 'text-blue-700', fill: '#2563eb' },
  acabado: { bg: 'bg-amber-100', text: 'text-amber-700', fill: '#f59e0b' },
  fijacion: { bg: 'bg-emerald-100', text: 'text-emerald-700', fill: '#10b981' },
};

export default function CostChart() {
  const currentProject = useProjectStore((s) => s.currentProject);

  if (!currentProject || currentProject.materials.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
        <span className="text-4xl">📊</span>
        <p className="text-sm font-medium text-slate-700 mt-2">Sin datos de materiales</p>
        <p className="text-xs text-slate-400 mt-0.5">Ingresa medidas en la calculadora para generar gráficos</p>
      </div>
    );
  }

  const categoryData = getMaterialsByCategory(currentProject.materials);
  const totalCost = categoryData.reduce((acc, c) => acc + c.value, 0);

  if (totalCost === 0) return null;

  // Compute SVG Donut Chart angles
  let cumulativeAngle = 0;
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const slices = categoryData.map((cat) => {
    const percentage = cat.value / totalCost;
    const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
    const strokeDashoffset = -circumference * cumulativeAngle;
    cumulativeAngle += percentage;

    return {
      ...cat,
      percentage: (percentage * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
      color: CATEGORY_COLORS[cat.category]?.fill || '#3b82f6',
    };
  });

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>📊</span> Distribución de Presupuesto
        </h3>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
          Total: S/ {totalCost.toFixed(2)}
        </span>
      </div>

      {/* Donut Chart Visual */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {slices.map((slice, i) => (
              <circle
                key={i}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-500 ease-out hover:opacity-80"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[11px] font-medium text-slate-400">Total Materiales</span>
            <span className="text-sm font-black text-slate-800">S/ {totalCost.toFixed(0)}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 w-full">
          {slices.map((slice) => (
            <div key={slice.category} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md" style={{ backgroundColor: slice.color }} />
                <span className="font-medium text-slate-700">{slice.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">{slice.percentage}%</span>
                <span className="font-bold text-slate-900 w-16 text-right">S/ {slice.value.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
