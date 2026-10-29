import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300 border border-slate-100">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden" />

        <div className="sticky top-0 bg-white/95 backdrop-blur-md flex items-center justify-between p-4 border-b border-slate-100 z-10">
          <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
