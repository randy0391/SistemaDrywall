import { useProjectStore } from '../stores/useProjectStore';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { DEFAULT_PRICES } from '../utils/constants';

const priceFields = [
  { key: 'planchaDrywall12mm', label: 'Plancha Drywall 1/2" (12.7mm)' },
  { key: 'planchaDrywall15mm', label: 'Plancha Drywall 5/8" (15mm)' },
  { key: 'paranteMetalico89mm', label: 'Parante Metálico 89mm' },
  { key: 'rielMetalico89mm', label: 'Riel Metálico 89mm' },
  { key: 'paranteMetalico64mm', label: 'Parante Metálico 64mm' },
  { key: 'rielMetalico64mm', label: 'Riel Metálico 64mm' },
  { key: 'tornilloDrywall1inch', label: 'Tornillo Drywall 1"' },
  { key: 'tornilloWafer', label: 'Tornillo Wafer' },
  { key: 'cintaPapel', label: 'Cinta para Juntas (rollo)' },
  { key: 'cintaMalla', label: 'Cinta Malla (rollo)' },
  { key: 'masilla', label: 'Masilla para Juntas (bolsa 28kg)' },
  { key: 'esquinero', label: 'Esquinero Metálico' },
  { key: 'fulminante', label: 'Fulminante' },
  { key: 'clavo', label: 'Clavo' },
] as const;

export default function SettingsPage() {
  const { prices, updatePrices } = useProjectStore();
  const navigate = useNavigate();

  const handleReset = () => {
    if (confirm('¿Restaurar precios predeterminados?')) {
      updatePrices(DEFAULT_PRICES);
    }
  };

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
      </div>

      <Card>
        <h3 className="font-semibold text-gray-800 mb-4">💰 Precios Unitarios (S/.)</h3>
        <div className="space-y-3">
          {priceFields.map(field => (
            <Input
              key={field.key}
              label={field.label}
              type="number"
              step="0.01"
              min="0"
              suffix="S/"
              value={prices[field.key as keyof typeof prices]}
              onChange={e => updatePrices({ [field.key]: parseFloat(e.target.value) || 0 })}
            />
          ))}
        </div>
        <div className="mt-4">
          <Button variant="secondary" fullWidth onClick={handleReset}>
            Restaurar Precios Predeterminados
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-800 mb-2">ℹ️ Acerca de</h3>
        <p className="text-sm text-gray-600">DrywallCalc Pro v1.0</p>
        <p className="text-sm text-gray-500">Calculadora profesional de materiales para drywall con diseño 3D.</p>
      </Card>
    </div>
  );
}
