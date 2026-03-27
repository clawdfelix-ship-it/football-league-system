// Kit color options for teams
export const KIT_COLORS = [
  { value: 'white', label: '白色', hex: '#FFFFFF', text: 'text-slate-900' },
  { value: 'black', label: '黑色', hex: '#000000', text: 'text-white' },
  { value: 'red', label: '紅色', hex: '#DC2626', text: 'text-white' },
  { value: 'blue', label: '藍色', hex: '#2563EB', text: 'text-white' },
  { value: 'green', label: '綠色', hex: '#16A34A', text: 'text-white' },
  { value: 'yellow', label: '黃色', hex: '#EAB308', text: 'text-slate-900' },
  { value: 'purple', label: '紫色', hex: '#9333EA', text: 'text-white' },
  { value: 'orange', label: '橙色', hex: '#EA580C', text: 'text-white' },
] as const;

export type KitColor = typeof KIT_COLORS[number]['value'];
