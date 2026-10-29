import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Inicio', icon: 'home', type: 'general' },
  { path: '/calculator', label: 'Drywall', icon: 'drywall', type: 'drywall' },
  { path: '/electrical', label: 'Eléctrica', icon: 'bolt', type: 'electric' },
  { path: '/viewer3d', label: '3D', icon: 'cube', type: 'general' },
  { path: '/projects', label: 'Proyectos', icon: 'folder', type: 'general' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const icons: Record<string, ReactNode> = {
    home: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    drywall: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008ZM12 11.25h.008v.008H12v-.008Zm0 2.25h.008v.008H12v-.008Zm0 2.25h.008v.008H12v-.008Zm0 2.25h.008v.008H12v-.008Zm3.75-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008v-.008ZM5.25 6a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V6Z" />
      </svg>
    ),
    bolt: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    cube: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    folder: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
      </svg>
    ),
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] z-50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          let activeStyle = 'text-blue-600 bg-blue-50/80 shadow-xs border border-blue-200/50';
          if (tab.type === 'electric') {
            activeStyle = 'text-amber-700 bg-amber-50/90 shadow-xs border border-amber-300/60 font-black';
          } else if (tab.type === 'drywall') {
            activeStyle = 'text-indigo-700 bg-indigo-50/90 shadow-xs border border-indigo-200/60 font-black';
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive ? activeStyle : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                {icons[tab.icon]}
                {isActive && (
                  <span
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      tab.type === 'electric'
                        ? 'bg-amber-500 shadow-sm shadow-amber-400'
                        : 'bg-blue-600 shadow-sm shadow-blue-400'
                    }`}
                  />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-black' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
