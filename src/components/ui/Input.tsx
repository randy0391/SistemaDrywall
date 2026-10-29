import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  suffix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, suffix, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">{label}</label>
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full px-3.5 py-2.5 bg-white border rounded-2xl text-sm font-medium
              shadow-xs transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 hover:border-slate-300'}
              ${suffix ? 'pr-12' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
