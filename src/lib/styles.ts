export type StyleOption = {
  id: number;
  name: string;
  url: string;
};

export const STYLE_OPTIONS: readonly StyleOption[] = [
  { id: 1, name: 'Code Brackets · Blue', url: '/styles/style-1.png' },
  { id: 2, name: 'Code Brackets · Sun', url: '/styles/style-2.png' },
  { id: 3, name: 'Cursor & Chat', url: '/styles/style-3.png' },
  { id: 4, name: 'Build with AI Ribbon', url: '/styles/style-4.png' },
  { id: 5, name: 'BwAI Pill · 2026', url: '/styles/style-5.png' },
  { id: 6, name: 'Hex Spark', url: '/styles/style-6.png' },
] as const;
