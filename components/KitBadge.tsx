'use client';

import { getKitColorInfo, KIT_COLORS } from '@/lib/kitColors';

interface KitBadgeProps {
  colorValue: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function KitBadge({ colorValue, size = 'md', showLabel = false }: KitBadgeProps) {
  const color = getKitColorInfo(colorValue);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
  };
  
  const isSplit = color.type === 'split' && color.hex2;
  
  return (
    <div className="flex items-center gap-1.5">
      <div 
        className={`${sizeClasses[size]} rounded-full border border-slate-300 shadow-sm overflow-hidden flex-shrink-0`}
        style={isSplit ? {
          background: `linear-gradient(135deg, ${color.hex} 50%, ${color.hex2} 50%)`,
        } : {
          backgroundColor: color.hex,
        }}
        title={color.label}
      />
      {showLabel && (
        <span className="text-xs text-slate-600 font-medium">{color.label}</span>
      )}
    </div>
  );
}

// Kit Color Picker with split color options
interface KitColorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export function KitColorPicker({ label = '', value, onChange }: KitColorPickerProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-zinc-600 block">{label}</label>
      )}
      <div className="flex flex-wrap gap-2">
        {KIT_COLORS.map((color) => {
          const isSelected = value === color.value;
          const isSplit = color.type === 'split' && color.hex2;
          
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange(color.value)}
              className={`
                relative w-10 h-10 rounded-full border-2 shadow-sm transition-all
                ${isSelected 
                  ? 'border-blue-500 ring-2 ring-blue-200 scale-110' 
                  : 'border-slate-200 hover:border-slate-400 hover:scale-105'}
              `}
              style={isSplit ? {
                background: `linear-gradient(135deg, ${color.hex} 50%, ${color.hex2} 50%)`,
              } : {
                backgroundColor: color.hex,
              }}
              title={color.label}
            >
              {isSelected && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={color.text}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default KitBadge;