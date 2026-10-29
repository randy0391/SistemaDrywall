import { useState } from 'react';
import type { Project } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { formatWhatsAppOrder, getWhatsAppOrderUrl } from '../../utils/whatsapp';

interface WhatsAppOrderModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppOrderModal({ project, isOpen, onClose }: WhatsAppOrderModalProps) {
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);

  if (!project) return null;

  const orderText = formatWhatsAppOrder(project);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Error al copiar el texto al portapapeles');
    }
  };

  const handleOpenWhatsApp = () => {
    const url = getWhatsAppOrderUrl(project, phone);
    window.open(url, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📲 Pedido para Ferretería por WhatsApp">
      <div className="space-y-4">
        <p className="text-xs text-slate-600">
          Envía la lista completa de materiales cuantificados con 1 solo clic al WhatsApp de tu ferretería o proveedor de drywall de confianza.
        </p>

        <Input
          label="Número de WhatsApp de la Ferretería (Opcional)"
          placeholder="Ej: 987654321 (o déjalo vacío para elegir en WhatsApp)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {/* Message Preview Box */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Vista Previa del Mensaje
          </label>
          <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-700 leading-relaxed shadow-inner">
            {orderText}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            {copied ? '✅ ¡Copiado!' : '📋 Copiar Texto'}
          </button>
          <Button
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            onClick={handleOpenWhatsApp}
          >
            Abrir WhatsApp 🚀
          </Button>
        </div>
      </div>
    </Modal>
  );
}
