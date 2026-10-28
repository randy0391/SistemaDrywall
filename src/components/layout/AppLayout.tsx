import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import { useProjectStore } from '../../stores/useProjectStore';
import { decodeProjectFromUrl } from '../../utils/share';
import confetti from 'canvas-confetti';

export default function AppLayout() {
  const navigate = useNavigate();
  const { importFromSketch } = useProjectStore();
  const [importNotification, setImportNotification] = useState<string | null>(null);

  useEffect(() => {
    // Check if URL has ?import=
    const params = new URLSearchParams(window.location.search);
    const importData = params.get('import');

    if (importData) {
      const decoded = decodeProjectFromUrl(importData);
      if (decoded && decoded.walls) {
        importFromSketch(
          decoded.walls,
          decoded.ceilings || [],
          undefined,
          decoded.name || 'Proyecto Importado'
        );

        setImportNotification(`¡Proyecto "${decoded.name}" recibido y guardado en tu celular! 📲`);

        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Clean query parameter from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);

        // Redirect to calculator to view materials immediately
        navigate('/calculator');

        setTimeout(() => setImportNotification(null), 5000);
      }
    }
  }, [importFromSketch, navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Import Notification Banner */}
      {importNotification && (
        <div className="fixed top-16 left-4 right-4 max-w-md mx-auto bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl z-[150] flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎉</span>
            <p className="text-xs font-bold leading-tight">{importNotification}</p>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-white/80 hover:text-white font-bold text-sm px-1"
          >
            ✕
          </button>
        </div>
      )}

      <main className="pt-16 pb-20 px-4 max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
