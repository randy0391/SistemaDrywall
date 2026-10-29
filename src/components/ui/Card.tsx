import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-3xl shadow-xs border border-slate-200/90 p-4 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 active:scale-[0.99]' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
