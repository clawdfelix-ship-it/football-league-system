'use client';

import { KIT_COLORS, getKitColorInfo } from '@/lib/kitColors';

interface KitColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export default function KitColorPicker({ label, value, onChange }: KitColorPickerProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>
      <div className="grid grid-cols-4 gap-2">
        {KIT_COLORS.map((color) => {
          const isSelected = value === color.value;
          const isSplit = color.type === 'split' && color.hex2;
          
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange(color.value)}
              className={`
                relative w-full aspect-square rounded-lg border-2 transition-all
                ${isSelected ? 'border-blue-600 scale-110 shadow-lg' : 'border-gray-300 hover:border-gray-400'}
              `}
              style={isSplit ? {
                background: `linear-gradient(135deg, ${color.hex} 50%, ${color.hex2} 50%)`,
              } : {
                backgroundColor: color.hex,
              }}
              title={color.label}
            >
              {isSelected && (
                <span className={`absolute inset-0 flex items-center justify-center ${color.text}`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        已選擇：<span className="font-medium">{getKitColorInfo(value).label}</span>
      </p>
    </div>
  );
}