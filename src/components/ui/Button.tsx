import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: ReactNode;
}

const variants = {
  primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/25',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/80',
  danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-sm shadow-red-500/20',
  ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  amber: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-amber-500/25',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-bold rounded-2xl
        transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98] cursor-pointer
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}
      `}
      {...props}
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
