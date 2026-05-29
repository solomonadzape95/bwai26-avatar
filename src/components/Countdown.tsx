import { useCountdown } from '../lib/useCountdown';

type Props = {
  target: Date | null;
  size?: 'sm' | 'lg' | 'xl';
};

const GOOGLE_COLORS = ['text-bwai-blue', 'text-bwai-red', 'text-bwai-yellow', 'text-bwai-green'];

export default function Countdown({ target, size = 'lg' }: Props) {
  const c = useCountdown(target);

  const cell =
    size === 'xl'
      ? 'min-w-[140px] px-4 py-4 sm:min-w-[200px] sm:px-8 sm:py-6'
      : size === 'lg'
      ? 'min-w-[88px] px-4 py-3 sm:min-w-[112px]'
      : 'min-w-[56px] px-2 py-2';

  const digit =
    size === 'xl'
      ? 'text-[5rem] leading-none sm:text-[8rem] lg:text-[11rem]'
      : size === 'lg'
      ? 'text-4xl sm:text-5xl'
      : 'text-2xl';

  const label =
    size === 'xl'
      ? 'mt-3 text-sm font-semibold uppercase tracking-[0.3em] sm:text-base'
      : size === 'lg'
      ? 'mt-1 text-xs uppercase tracking-widest sm:text-sm'
      : 'mt-1 text-[10px] uppercase tracking-widest';

  const parts: Array<[string, number]> = [
    ['Days', c.days],
    ['Hours', c.hours],
    ['Minutes', c.minutes],
    ['Seconds', c.seconds],
  ];

  return (
    <div className="flex flex-wrap items-stretch justify-center gap-2 sm:gap-4">
      {parts.map(([k, v], i) => (
        <div
          key={k}
          className={`flex flex-col items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200 ${cell}`}
        >
          <span
            className={`font-mono font-bold tabular-nums ${digit} ${
              size === 'xl' ? GOOGLE_COLORS[i % GOOGLE_COLORS.length] : 'text-bwai-ink'
            }`}
          >
            {String(v).padStart(2, '0')}
          </span>
          <span className={`font-medium text-neutral-500 ${label}`}>{k}</span>
        </div>
      ))}
    </div>
  );
}
