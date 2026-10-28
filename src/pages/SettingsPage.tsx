import { useProjectStore } from '../stores/useProjectStore';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { DEFAULT_PRICES, DEFAULT_LABOR_COSTS } from '../utils/constants';

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
  const {
    prices,
    updatePrices,
    laborCosts,
    updateLaborCosts,
    geminiApiKey,
    setGeminiApiKey,
  } = useProjectStore();
  const navigate = useNavigate();

  const handleResetPrices = () => {
    if (confirm('¿Restaurar precios de materiales a los valores predeterminados?')) {
      updatePrices(DEFAULT_PRICES);
    }
  };

  const handleResetLabor = () => {
    if (confirm('¿Restaurar costos de mano de obra a los valores predeterminados?')) {
      updateLaborCosts(DEFAULT_LABOR_COSTS);
    }
  };

  return (
    <div className="py-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-slate-900">Configuración</h2>
      </div>

      {/* 🤖 Google Gemini Vision AI */}
      <Card className="border-purple-200 bg-gradient-to-br from-white to-purple-50/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span>🤖</span> Reconocimiento de Dibujos IA
          </h3>
          <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-2 py-0.5 rounded-full">
            Gemini Vision
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          Permite que el sistema analice las fotos que tomes a croquis hechos a lápiz y cree el modelo 3D automáticamente.
        </p>

        <div className="space-y-2">
          <Input
            label="Google Gemini API Key"
            type="password"
            placeholder="AIzaSy..."
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
          />
          <div className="flex justify-between items-center text-[11px] pt-1">
            <span className="text-slate-400">¿No tienes clave?</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 font-bold hover:underline"
            >
              Obtener clave gratuita en Google AI Studio ↗
            </a>
          </div>
        </div>
      </Card>

      {/* 👷 Mano de Obra */}
      <Card>
        <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <span>👷</span> Tarifas de Mano de Obra (S/.)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Costos por metro cuadrado aplicados a los presupuestos.
        </p>

        <div className="space-y-3">
          <Input
            label="Tabique simple (una cara) por m²"
            type="number"
            step="0.50"
            suffix="S/"
            value={laborCosts.costPerSqmTabiqueSimple}
            onChange={(e) => updateLaborCosts({ costPerSqmTabiqueSimple: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Tabique divisorio (doble cara) por m²"
            type="number"
            step="0.50"
            suffix="S/"
            value={laborCosts.costPerSqmTabiqueDoble}
            onChange={(e) => updateLaborCosts({ costPerSqmTabiqueDoble: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Cielo raso suspendido por m²"
            type="number"
            step="0.50"
            suffix="S/"
            value={laborCosts.costPerSqmCieloRaso}
            onChange={(e) => updateLaborCosts({ costPerSqmCieloRaso: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Acabado, cinta y masillado por m²"
            type="number"
            step="0.50"
            suffix="S/"
            value={laborCosts.costPerSqmAcabado}
            onChange={(e) => updateLaborCosts({ costPerSqmAcabado: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Margen de imprevistos y utilidad predeterminado"
            type="number"
            step="1"
            suffix="%"
            value={laborCosts.profitMarginPercent}
            onChange={(e) => updateLaborCosts({ profitMarginPercent: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="mt-4">
          <Button variant="secondary" fullWidth onClick={handleResetLabor}>
            Restaurar Tarifas de Mano de Obra
          </Button>
        </div>
      </Card>

      {/* 💰 Precios de Materiales */}
      <Card>
        <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <span>💰</span> Precios de Materiales (S/.)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Precios unitarios de compra o ferretería local.
        </p>
        <div className="space-y-3">
          {priceFields.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              type="number"
              step="0.01"
              min="0"
              suffix="S/"
              value={prices[field.key as keyof typeof prices]}
              onChange={(e) => updatePrices({ [field.key]: parseFloat(e.target.value) || 0 })}
            />
          ))}
        </div>
        <div className="mt-4">
          <Button variant="secondary" fullWidth onClick={handleResetPrices}>
            Restaurar Precios Predeterminados
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-800 mb-1">ℹ️ Acerca de</h3>
        <p className="text-xs text-slate-600 font-semibold">DrywallCalc Pro 3D v2.0</p>
        <p className="text-xs text-slate-500 mt-1">
          Aplicación profesional con cálculo de materiales, mano de obra, visualización 3D interactiva y escaneo inteligente de dibujos a mano con IA.
        </p>
      </Card>
    </div>
  );
}
