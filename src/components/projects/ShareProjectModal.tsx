import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { Project } from '../../types';
import { encodeProjectToUrl } from '../../utils/share';

interface ShareProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareProjectModal({ project, isOpen, onClose }: ShareProjectModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!project || !isOpen) return;

    try {
      const encoded = encodeProjectToUrl(project);
      // Construct full share URL based on current origin
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}/?import=${encoded}`;
      setShareUrl(fullUrl);

      // Generate high resolution QR code
      QRCode.toDataURL(fullUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).then((url) => {
        setQrDataUrl(url);
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  }, [project, isOpen]);

  if (!project) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadFile = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.name.replace(/\s+/g, '_')}_backup.drywall`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📲 Pasar Proyecto a tu Celular">
      <div className="space-y-4 text-center">
        <p className="text-xs text-slate-500">
          Apunta la cámara de tu celular a este código QR para abrir el proyecto <strong>&quot;{project.name}&quot;</strong> directamente en tu app.
        </p>

        {/* QR Code Container */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200 inline-block shadow-md mx-auto">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Código QR del proyecto"
              className="w-56 h-56 mx-auto rounded-lg"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
              Generando código QR...
            </div>
          )}
        </div>

        {/* Sharing Actions */}
        <div className="space-y-2 pt-1 text-left">
          <Button
            fullWidth
            onClick={handleCopyLink}
            variant="primary"
            className="py-2.5 font-bold bg-blue-600 hover:bg-blue-700"
          >
            {copied ? '✓ ¡Enlace Copiado al Portapapeles!' : '🔗 Copiar Enlace para WhatsApp'}
          </Button>

          <Button
            fullWidth
            onClick={handleDownloadFile}
            variant="secondary"
            className="py-2.5 font-semibold text-slate-700"
          >
            💾 Descargar Archivo de Respaldo (.drywall)
          </Button>
        </div>

        <p className="text-[11px] text-slate-400">
          * Al abrir el enlace en tu celular, el proyecto se guardará automáticamente en la memoria de tu teléfono.
        </p>
      </div>
    </Modal>
  );
}
