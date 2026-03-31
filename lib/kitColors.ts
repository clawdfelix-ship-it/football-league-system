// Kit color options for teams - supports solid and split colors
export const KIT_COLORS = [
  // Solid colors
  { value: 'white', label: '白色', hex: '#FFFFFF', text: 'text-slate-900', type: 'solid' },
  { value: 'black', label: '黑色', hex: '#000000', text: 'text-white', type: 'solid' },
  { value: 'red', label: '紅色', hex: '#DC2626', text: 'text-white', type: 'solid' },
  { value: 'blue', label: '藍色', hex: '#2563EB', text: 'text-white', type: 'solid' },
  { value: 'green', label: '綠色', hex: '#16A34A', text: 'text-white', type: 'solid' },
  { value: 'yellow', label: '黃色', hex: '#EAB308', text: 'text-slate-900', type: 'solid' },
  { value: 'purple', label: '紫色', hex: '#9333EA', text: 'text-white', type: 'solid' },
  { value: 'orange', label: '橙色', hex: '#EA580C', text: 'text-white', type: 'solid' },
  { value: 'indigo', label: '靛藍色', hex: '#4F46E5', text: 'text-white', type: 'solid' },
  { value: 'navy', label: '深藍色', hex: '#1e3a5f', text: 'text-white', type: 'solid' },
  { value: 'grey', label: '灰色', hex: '#6b7280', text: 'text-white', type: 'solid' },
  // Undecided
  { value: 'X', label: '待定', hex: '#9ca3af', text: 'text-white', type: 'solid' },
  // Split colors (two-tone kits)
  { value: 'white-green', label: '白+綠', hex: '#FFFFFF', hex2: '#16A34A', text: 'text-slate-900', type: 'split' },
  { value: 'red-blue', label: '紅+藍', hex: '#DC2626', hex2: '#2563EB', text: 'text-white', type: 'split' },
  { value: 'blue-white', label: '藍+白', hex: '#2563EB', hex2: '#FFFFFF', text: 'text-white', type: 'split' },
  { value: 'red-white', label: '紅+白', hex: '#DC2626', hex2: '#FFFFFF', text: 'text-white', type: 'split' },
] as const;

export type KitColor = typeof KIT_COLORS[number]['value'];

// Helper to get color info
export function getKitColorInfo(value: string) {
  return KIT_COLORS.find(c => c.value === value) || KIT_COLORS[0];
}
