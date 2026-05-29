import { useTheme, type ThemePref } from '../lib/theme';

const OPTIONS: Array<{ value: ThemePref; label: string; icon: string }> = [
  { value: 'light', label: 'Light', icon: '☀︎' },
  { value: 'system', label: 'Auto', icon: '⌥' },
  { value: 'dark', label: 'Dark', icon: '☾' },
];

export default function ThemeToggle() {
  const [pref, setPref] = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-full bg-white p-0.5 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={pref === o.value}
          title={o.label}
          onClick={() => setPref(o.value)}
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors ${
            pref === o.value
              ? 'bg-bwai-ink text-white dark:bg-white dark:text-bwai-ink'
              : 'text-neutral-500 hover:text-bwai-ink dark:text-neutral-400 dark:hover:text-neutral-100'
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
