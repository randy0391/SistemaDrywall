import { useProjectStore } from '../../stores/useProjectStore';

export default function MaterialBarChart() {
  const currentProject = useProjectStore((s) => s.currentProject);

  if (!currentProject || currentProject.materials.length === 0) return null;

  // Top 5 materials by cost
  const sorted = [...currentProject.materials]
    .sort((a, b) => b.totalPrice - a.totalPrice)
    .slice(0, 5);

  const maxPrice = Math.max(...sorted.map((m) => m.totalPrice), 1);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>📈</span> Top Materiales de Mayor Inversión
        </h3>
        <span className="text-[11px] font-medium text-slate-400">Por costo total</span>
      </div>

      <div className="space-y-3">
        {sorted.map((mat) => {
          const percentage = (mat.totalPrice / maxPrice) * 100;
          return (
            <div key={mat.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {mat.name}
                </span>
                <span className="font-bold text-blue-600">S/ {mat.totalPrice.toFixed(2)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Cant: {mat.quantity} {mat.unit}s</span>
                <span>P.U: S/ {mat.unitPrice.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
