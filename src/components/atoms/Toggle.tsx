import React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false
}) => {
  return (
    <label className={`flex items-center justify-between cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {(label || description) && (
        <div className="mr-4">
          {label && <span className="text-sm font-semibold text-[#2D3B42] block group-hover:text-[#EF4623] transition-colors">{label}</span>}
          {description && <span className="text-xs text-[#2D3B42]/60 block mt-0.5">{description}</span>}
        </div>
      )}
      <div 
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-[#EF4623] shadow-[0_0_12px_rgba(239,70,35,0.35)]' : 'bg-[#2D3B42]/20'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  );
};
