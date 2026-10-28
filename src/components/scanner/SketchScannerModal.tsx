import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useProjectStore } from '../../stores/useProjectStore';
import type { WallMeasurement, CeilingMeasurement } from '../../types';
import confetti from 'canvas-confetti';

interface SketchScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Compress and resize image to lightweight JPEG for ultra-fast mobile upload
function compressImage(file: File, maxDim = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fill white background for transparent PNGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function SketchScannerModal({ isOpen, onClose, onSuccess }: SketchScannerModalProps) {
  const { geminiApiKey, setGeminiApiKey, importFromSketch } = useProjectStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable detected results
  const [detectedProjectName, setDetectedProjectName] = useState('Proyecto desde Bosquejo');
  const [detectedWalls, setDetectedWalls] = useState<WallMeasurement[]>([]);
  const [detectedCeilings, setDetectedCeilings] = useState<CeilingMeasurement[]>([]);
  const [detectedNotes, setDetectedNotes] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'review'>('upload');

  // Handle image selection with auto-compression
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setStatusMessage('Optimizando foto para análisis rápido...');
    try {
      const compressedDataUrl = await compressImage(file, 1280, 0.82);
      setImagePreview(compressedDataUrl);
      setStatusMessage('');
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo leer la foto seleccionada.');
      setStatusMessage('');
    }
  };

  // Analyze sketch using Gemini Vision API
  const analyzeSketch = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setStatusMessage('Enviando a Gemini Vision...');

    try {
      const activeApiKey = (geminiApiKey && geminiApiKey.trim().length > 10)
        ? geminiApiKey.trim()
        : 'AIzaSyDAR9JEpDaeu2RlYun_u7HWDKawPaD0w2w';

      const base64Data = imagePreview.split(',')[1];

      const prompt = `Actúa como un maestro de obras e ingeniero civil experto en tabiquería y construcción con Drywall.
Examina atentamente este dibujo, plano a lápiz o croquis hecho a mano alzada.
Extrae todas las paredes con sus medidas numéricas (ancho o largo y alto en metros), puertas, ventanas y cielos rasos si existen.
Reglas:
1. Si una pared no tiene altura indicada, asume 2.40 metros.
2. Si no especifica una o dos caras, asume doble cara (hasDoubleSide: true).
3. Si detectas aberturas como puertas (aprox 0.90x2.10) o ventanas (aprox 1.20x1.10), agrégalas a "openings".
4. Devuelve ESTRICTAMENTE un JSON con esta estructura exacta:
{
  "projectName": "Nombre sugerido de la habitación",
  "notes": "Observaciones detectadas en el boceto",
  "walls": [
    {
      "name": "Pared 1",
      "width": 3.5,
      "height": 2.4,
      "hasDoubleSide": true,
      "openings": [
        { "type": "puerta", "width": 0.9, "height": 2.1 }
      ]
    }
  ],
  "ceilings": [
    {
      "name": "Techo falso",
      "width": 3.5,
      "length": 4.0,
      "dropHeight": 0.1
    }
  ]
}`;

      const requestBody = JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      setStatusMessage('Gemini Vision interpretando medidas y trazos...');

      // Try gemini-3.5-flash-lite, fallback to gemini-3.8-flash
      let response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${activeApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
        }
      );

      if (!response.ok) {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${activeApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
          }
        );
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error?.message || `Error del servidor de IA (${response.status})`);
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const textResponse = parts.map((p: { text?: string }) => p.text || '').join('\n');

      if (!textResponse.trim()) {
        throw new Error('La IA no devolvió respuesta. Intenta con una foto más iluminada o de más cerca.');
      }

      setStatusMessage('Extrayendo paredes y aberturas...');

      // Robust JSON extraction
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(textResponse);
      } catch {
        const match = textResponse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      }

      if (!parsed) {
        throw new Error('No se pudo decodificar el formato de medidas del dibujo.');
      }

      populateDetected(parsed);
    } catch (err: unknown) {
      console.error('Scan error:', err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al procesar el dibujo. Asegúrate de que las medidas numéricas sean legibles.'
      );
    } finally {
      setIsAnalyzing(false);
      setStatusMessage('');
    }
  };

  // Populate state with flexible detection format
  const populateDetected = (data: unknown) => {
    let rawWalls: unknown[] = [];
    let rawCeilings: unknown[] = [];
    let projName = 'Proyecto Escaneado';
    let notes = '';

    if (Array.isArray(data)) {
      rawWalls = data;
    } else if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      projName = (obj.projectName as string) || (obj.nombre as string) || 'Proyecto Escaneado';
      notes = (obj.notes as string) || (obj.observaciones as string) || '';

      if (Array.isArray(obj.walls)) rawWalls = obj.walls;
      else if (Array.isArray(obj.paredes)) rawWalls = obj.paredes;
      else if (Array.isArray(obj.tabiques)) rawWalls = obj.tabiques;

      if (Array.isArray(obj.ceilings)) rawCeilings = obj.ceilings;
      else if (Array.isArray(obj.techos)) rawCeilings = obj.techos;
    }

    if (rawWalls.length === 0 && rawCeilings.length === 0) {
      setErrorMsg('No se detectaron paredes con medidas numéricas claras en la foto. Agrega al menos una medida visible como "3.5m" o "4x2.4m".');
      return;
    }

    setDetectedProjectName(projName);
    setDetectedNotes(notes);

    interface RawWallItem {
      name?: string;
      nombre?: string;
      width?: number;
      ancho?: number;
      largo?: number;
      height?: number;
      alto?: number;
      hasDoubleSide?: boolean;
      dobleCara?: boolean;
      openings?: Array<{ type?: string; width?: number; height?: number; tipo?: string; ancho?: number; alto?: number }>;
      aberturas?: Array<{ type?: string; width?: number; height?: number; tipo?: string; ancho?: number; alto?: number }>;
    }

    const walls: WallMeasurement[] = rawWalls.map((item, i) => {
      const w = item as RawWallItem;
      const widthVal = Number(w.width ?? w.ancho ?? w.largo ?? 3.0);
      const heightVal = Number(w.height ?? w.alto ?? 2.4);
      const isDouble = w.hasDoubleSide !== false && w.dobleCara !== false;

      const rawOps = w.openings || w.aberturas || [];
      const openings = rawOps.map((op) => {
        const typeStr = (op.type || op.tipo || '').toLowerCase();
        const isWindow = typeStr.includes('vent') || typeStr.includes('window');
        return {
          id: generateId(),
          type: (isWindow ? 'ventana' : 'puerta') as 'puerta' | 'ventana',
          width: Number(op.width ?? op.ancho ?? (isWindow ? 1.2 : 0.9)),
          height: Number(op.height ?? op.alto ?? (isWindow ? 1.1 : 2.1)),
        };
      });

      return {
        id: generateId(),
        name: w.name || w.nombre || `Pared ${i + 1}`,
        width: Math.max(widthVal, 0.2),
        height: Math.max(heightVal, 0.5),
        type: 'tabique',
        hasDoubleSide: isDouble,
        openings,
      };
    });

    interface RawCeilingItem {
      name?: string;
      nombre?: string;
      width?: number;
      ancho?: number;
      length?: number;
      largo?: number;
      dropHeight?: number;
      descuelgue?: number;
    }

    const ceilings: CeilingMeasurement[] = rawCeilings.map((item, i) => {
      const c = item as RawCeilingItem;
      return {
        id: generateId(),
        name: c.name || c.nombre || `Cielo Raso ${i + 1}`,
        width: Number(c.width ?? c.ancho ?? 3.0),
        length: Number(c.length ?? c.largo ?? 3.0),
        dropHeight: Number(c.dropHeight ?? c.descuelgue ?? 0.1),
      };
    });

    setDetectedWalls(walls);
    setDetectedCeilings(ceilings);
    setStep('review');
  };

  // Confirm and import to project
  const handleConfirmImport = () => {
    importFromSketch(detectedWalls, detectedCeilings, imagePreview || undefined, detectedProjectName);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  const updateDetectedWall = (id: string, field: 'width' | 'height' | 'name', value: string | number) => {
    setDetectedWalls((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w))
    );
  };

  const removeDetectedWall = (id: string) => {
    setDetectedWalls((prev) => prev.filter((w) => w.id !== id));
  };

  const addManualWallToDetected = () => {
    setDetectedWalls((prev) => [
      ...prev,
      {
        id: generateId(),
        name: `Pared ${prev.length + 1}`,
        width: 3.0,
        height: 2.4,
        type: 'tabique',
        hasDoubleSide: true,
        openings: [],
      },
    ]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📸 Escanear Dibujo a Mano (IA)">
      {step === 'upload' ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Toma una foto al dibujo o croquis en papel con las medidas de tu obra. Google Gemini Vision detectará las paredes, alturas, puertas y ventanas.
          </p>

          {/* Photo capture zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-6 text-center cursor-pointer transition-all active:scale-[0.99] flex flex-col items-center justify-center min-h-[190px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="space-y-2 w-full">
                <img
                  src={imagePreview}
                  alt="Dibujo a mano"
                  className="max-h-48 mx-auto rounded-xl shadow-md object-contain border border-slate-200"
                />
                <p className="text-xs text-blue-600 font-bold">Toca aquí para cambiar la foto 🔄</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl shadow-md">
                  📷
                </div>
                <p className="text-sm font-bold text-slate-800">Tomar foto o subir dibujo</p>
                <p className="text-xs text-slate-400">Funciona con lápiz, lapicero o plano en obra</p>
              </div>
            )}
          </div>

          {/* Status / Loading indicator */}
          {statusMessage && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold space-y-1">
              <p className="font-bold">⚠️ Atención:</p>
              <p>{errorMsg}</p>
            </div>
          )}

          {/* API Key info */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <span className="text-slate-600 text-[11px] font-medium flex items-center gap-1.5">
              <span>🤖</span> Gemini Vision conectado: <strong className="text-emerald-600">Activo ✓</strong>
            </span>
            <input
              type="password"
              title="Tu clave de Gemini"
              value={geminiApiKey || 'AIzaSyDAR9JEpDaeu2RlYun_u7HWDKawPaD0w2w'}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-24 text-[10px] px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-400 text-right"
            />
          </div>

          <Button
            fullWidth
            onClick={analyzeSketch}
            disabled={!imagePreview || isAnalyzing}
            className="py-3 font-bold bg-blue-600 hover:bg-blue-700 shadow-md text-sm"
          >
            {isAnalyzing ? '⏳ Analizando dibujo con IA...' : '🔍 Escanear y Detectar Medidas'}
          </Button>
        </div>
      ) : (
        /* STEP 2: REVIEW DETECTED MEASUREMENTS */
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-xs font-bold text-emerald-800">¡Medidas detectadas por la IA!</p>
              <p className="text-[11px] text-emerald-600">
                Verifica las paredes detectadas. Puedes editar cualquier número si lo deseas.
              </p>
            </div>
          </div>

          <Input
            label="Nombre del Proyecto"
            value={detectedProjectName}
            onChange={(e) => setDetectedProjectName(e.target.value)}
          />

          {detectedNotes && (
            <p className="text-xs bg-slate-50 p-2.5 rounded-xl text-slate-600 border border-slate-200 italic">
              &quot;{detectedNotes}&quot;
            </p>
          )}

          {/* Walls List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                🧱 Tabiques Detectados ({detectedWalls.length})
              </label>
              <button
                type="button"
                onClick={addManualWallToDetected}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                + Agregar pared
              </button>
            </div>

            {detectedWalls.map((wall) => (
              <div
                key={wall.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <input
                    value={wall.name}
                    onChange={(e) => updateDetectedWall(wall.id, 'name', e.target.value)}
                    className="font-bold text-xs bg-transparent border-b border-transparent focus:border-blue-500 focus:bg-white px-1 py-0.5 rounded text-slate-800"
                  />
                  <button
                    onClick={() => removeDetectedWall(wall.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold px-1"
                  >
                    🗑️
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium">Largo (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={wall.width}
                      onChange={(e) => updateDetectedWall(wall.id, 'width', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium">Alto (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={wall.height}
                      onChange={(e) => updateDetectedWall(wall.id, 'height', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                    />
                  </div>
                </div>

                {wall.openings.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {wall.openings.map((op, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold"
                      >
                        {op.type === 'puerta' ? '🚪 Puerta' : '🪟 Ventana'} {op.width}m × {op.height}m
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Ceilings List */}
          {detectedCeilings.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ⬆️ Cielo Raso ({detectedCeilings.length})
              </label>
              {detectedCeilings.map((c) => (
                <div key={c.id} className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-indigo-900">{c.name}</p>
                  <p className="text-indigo-700">
                    {c.width}m × {c.length}m = {(c.width * c.length).toFixed(2)} m²
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setStep('upload')} className="flex-1">
              ← Cambiar Foto
            </Button>
            <Button onClick={handleConfirmImport} className="flex-1 font-bold bg-emerald-600 hover:bg-emerald-700">
              ✓ Aplicar al 3D y Materiales
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
