import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/useProjectStore';
import Card from '../components/ui/Card';

export default function HomePage() {
  const navigate = useNavigate();
  const { projects, setCurrentProject } = useProjectStore();
  const recentProjects = [...projects].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 5);

  const quickActions = [
    { title: 'Presupuesto Drywall', description: 'Tabiquería, placas especiales y cielos rasos', icon: '🧱', path: '/calculator' },
    { title: 'Instalaciones Eléctricas', description: 'Tomacorrientes, conmutados y tableros monofásicos 220V', icon: '⚡', path: '/electrical' },
    { title: 'Diseño y Visualizador 3D', description: 'Visualizar tu estructura en 3D interactivo', icon: '🎨', path: '/viewer3d' },
    { title: 'Mis Proyectos y Cotizaciones', description: 'Ver historial de presupuestos guardados', icon: '📁', path: '/projects' },
  ];

  const statusColors: Record<string, string> = {
    borrador: 'bg-gray-100 text-gray-600',
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

  return (
    <div className="py-4 space-y-6">
      {/* Hero Section */}
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold text-gray-900">¡Bienvenido!</h2>
        <p className="text-gray-500 mt-1">Calcula materiales de drywall en segundos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
          <p className="text-xs text-gray-500 mt-1">Proyectos Totales</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-yellow-600">
            {projects.filter(p => p.status === 'en_proceso').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">En Proceso</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Acciones Rápidas</h3>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-4"
            >
              <span className="text-3xl">{action.icon}</span>
              <div>
                <h4 className="font-semibold text-gray-900">{action.title}</h4>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 ml-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Proyectos Recientes</h3>
          <div className="space-y-2">
            {recentProjects.map((project) => (
              <Card
                key={project.id}
                onClick={() => { setCurrentProject(project.id); navigate('/calculator'); }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-500">{project.client}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      S/ {project.totalCost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
