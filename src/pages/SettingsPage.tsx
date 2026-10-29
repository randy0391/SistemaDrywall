import { useProjectStore } from '../stores/useProjectStore';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { DEFAULT_PRICES, DEFAULT_LABOR_COSTS } from '../utils/constants';

const sheetPriceFields = [
  { key: 'planchaDrywall12mm', label: 'Plancha Drywall ST Standard 1/2" (12.7mm)' },
  { key: 'planchaDrywall15mm', label: 'Plancha Drywall ST Standard 5/8" (15mm)' },
  { key: 'planchaDrywallRH', label: 'Plancha Drywall RH Verde (Antihumedad)' },
  { key: 'planchaDrywallRF', label: 'Plancha Drywall RF Rosada (Cortafuego)' },
  { key: 'planchaSuperboard6mm', label: 'Placa Fibrocemento Superboard 6mm (Exterior)' },
] as const;

const insulationPriceFields = [
  { key: 'lanaFibraVidrio50mm', label: 'Lana de Vidrio 50mm con Foil (rollo 14.4m²)' },
  { key: 'lanaRocaPaquete', label: 'Lana de Roca Acústica Alta Densidad (paquete 7.2m²)' },
] as const;

const structurePriceFields = [
  { key: 'paranteMetalico89mm', label: 'Parante Metálico 89mm × 3.05m' },
  { key: 'rielMetalico89mm', label: 'Riel Metálico 89mm × 3.05m' },
  { key: 'paranteMetalico64mm', label: 'Parante / Omega Metálico 64mm × 3.05m' },
  { key: 'rielMetalico64mm', label: 'Riel Metálico 64mm × 3.05m' },
] as const;

const fastenerPriceFields = [
  { key: 'tornilloDrywall1inch', label: 'Tornillo Drywall 1" (unidad)' },
  { key: 'tornilloWafer', label: 'Tornillo Wafer (unidad)' },
  { key: 'fulminante', label: 'Fulminante de fijación (unidad)' },
  { key: 'clavo', label: 'Clavo de impacto (unidad)' },
] as const;

const finishingPriceFields = [
  { key: 'cintaPapel', label: 'Cinta para Juntas de Papel (rollo 75m)' },
  { key: 'cintaMalla', label: 'Cinta Malla Autoadhesiva (rollo 90m)' },
  { key: 'masilla', label: 'Masilla para Juntas (bolsa 28kg)' },
  { key: 'esquinero', label: 'Esquinero Metálico 2.44m' },
] as const;

const lightingPriceFields = [
  { key: 'perfilLedAluminio', label: 'Perfil de Aluminio LED + Difusor (2m)' },
  { key: 'tiraLedMetro', label: 'Tira LED Continua de Alta Densidad (por metro)' },
] as const;

const paintPriceFields = [
  { key: 'selladorDrywallGalon', label: 'Sellador / Imprimante para Drywall (galón)' },
  { key: 'pinturaLatexGalon', label: 'Pintura Látex Lavable Mate (galón)' },
  { key: 'lijaAguaPliego', label: 'Lija de Agua grano 120 / 180 (pliego)' },
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
            label="Acabado, cinta y masillado a 3 manos por m²"
            type="number"
            step="0.50"
            suffix="S/"
            value={laborCosts.costPerSqmAcabado}
            onChange={(e) => updateLaborCosts({ costPerSqmAcabado: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Pintura látex a 2 manos y lijado por m²"
            type="number"
            step="0.50"
            suffix="S/"
            value={laborCosts.costPerSqmPintura || 8.00}
            onChange={(e) => updateLaborCosts({ costPerSqmPintura: parseFloat(e.target.value) || 0 })}
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
      <Card className="space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
            <span>💰</span> Precios Unitarios de Materiales (S/.)
          </h3>
          <p className="text-xs text-slate-500">
            Ajusta los precios de lista según tu ferretería local o distribuidor.
          </p>
        </div>

        {/* Planchas */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>📦</span> Planchas de Drywall y Fibrocemento
          </h4>
          <div className="space-y-2.5">
            {sheetPriceFields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type="number"
                step="0.50"
                min="0"
                suffix="S/"
                value={prices[field.key as keyof typeof prices]}
                onChange={(e) => updatePrices({ [field.key]: parseFloat(e.target.value) || 0 })}
              />
            ))}
          </div>
        </div>

        {/* Aislamientos */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>🔇</span> Aislamiento Térmico y Acústico
          </h4>
          <div className="space-y-2.5">
            {insulationPriceFields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type="number"
                step="1.00"
                min="0"
                suffix="S/"
                value={prices[field.key as keyof typeof prices]}
                onChange={(e) => updatePrices({ [field.key]: parseFloat(e.target.value) || 0 })}
              />
            ))}
          </div>
        </div>

        {/* Estructura */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>🔩</span> Perfilería y Estructura Metálica
          </h4>
          <div className="space-y-2.5">
            {structurePriceFields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type="number"
                step="0.20"
                min="0"
                suffix="S/"
                value={prices[field.key as keyof typeof prices]}
                onChange={(e) => updatePrices({ [field.key]: parseFloat(e.target.value) || 0 })}
              />
            ))}
          </div>
        </div>

        {/* Fijaciones */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>🔧</span> Fijaciones y Tornillería
          </h4>
          <div className="space-y-2.5">
            {fastenerPriceFields.map((field) => (
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
        </div>

        {/* Acabados */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>🎨</span> Cintas, Masillas y Esquineros
          </h4>
          <div className="space-y-2.5">
            {finishingPriceFields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type="number"
                step="0.50"
                min="0"
                suffix="S/"
                value={prices[field.key as keyof typeof prices]}
                onChange={(e) => updatePrices({ [field.key]: parseFloat(e.target.value) || 0 })}
              />
            ))}
          </div>
        </div>

        {/* Iluminación LED */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>💡</span> Perfiles e Iluminación LED
          </h4>
          <div className="space-y-2.5">
            {lightingPriceFields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type="number"
                step="0.50"
                min="0"
                suffix="S/"
                value={prices[field.key as keyof typeof prices]}
                onChange={(e) => updatePrices({ [field.key]: parseFloat(e.target.value) || 0 })}
              />
            ))}
          </div>
        </div>

        {/* Pintura y Sellador */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>🖌️</span> Pintura, Sellador y Lijas
          </h4>
          <div className="space-y-2.5">
            {paintPriceFields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type="number"
                step="0.50"
                min="0"
                suffix="S/"
                value={prices[field.key as keyof typeof prices]}
                onChange={(e) => updatePrices({ [field.key]: parseFloat(e.target.value) || 0 })}
              />
            ))}
          </div>
        </div>

        <div className="pt-3">
          <Button variant="secondary" fullWidth onClick={handleResetPrices}>
            Restaurar Todos los Precios a Predeterminados
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-800 mb-1">ℹ️ Acerca de</h3>
        <p className="text-xs text-slate-600 font-semibold">DrywallCalc Pro 3D v2.2</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Suite completa para contratistas e instaladores de drywall: cálculo automatizado de materiales, placas especiales (RH, RF, Superboard), aislamiento acústico, iluminación LED arquitectónica, pedidos instantáneos por WhatsApp, estimación de cronogramas y visualización 3D interactiva.
        </p>
      </Card>
    </div>
  );
}
