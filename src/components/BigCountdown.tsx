import { useCountdown } from '../lib/useCountdown';

type Unit = 'days' | 'hours' | 'minutes' | 'seconds';

type Props = {
  durationSeconds: number;
  endsAt: Date | null;
  mode: 'running' | 'frozen';
  variant?: 'public' | 'admin';
  tone?: 'light' | 'dark';
};

const UNIT_LABEL: Record<Unit, string> = {
  days: 'Days',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
};

function pickUnits(durationSeconds: number): Unit[] {
  if (durationSeconds <= 60) return ['seconds'];
  if (durationSeconds <= 3600) return ['minutes', 'seconds'];
  if (durationSeconds <= 86400) return ['hours', 'minutes', 'seconds'];
  return ['days', 'hours', 'minutes', 'seconds'];
}

function totalSecondsRemaining(endsAt: Date | null): number {
  if (!endsAt) return 0;
  return Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
}

function breakdown(totalSeconds: number, units: Unit[]): Record<Unit, number> {
  const out: Record<Unit, number> = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  let remaining = totalSeconds;
  if (units[0] === 'days') {
    out.days = Math.floor(remaining / 86400);
    remaining -= out.days * 86400;
    out.hours = Math.floor(remaining / 3600);
    remaining -= out.hours * 3600;
    out.minutes = Math.floor(remaining / 60);
    out.seconds = remaining - out.minutes * 60;
  } else if (units[0] === 'hours') {
    out.hours = Math.floor(remaining / 3600);
    remaining -= out.hours * 3600;
    out.minutes = Math.floor(remaining / 60);
    out.seconds = remaining - out.minutes * 60;
  } else if (units[0] === 'minutes') {
    out.minutes = Math.floor(remaining / 60);
    out.seconds = remaining - out.minutes * 60;
  } else {
    out.seconds = remaining;
  }
  return out;
}

const DIGIT_BY_VARIANT = {
  public:
    'text-[6rem] sm:text-[10rem] lg:text-[14rem] xl:text-[18rem]',
  admin: 'text-[4rem] sm:text-[7rem] lg:text-[9rem]',
};

const LABEL_BY_VARIANT = {
  public: 'mt-3 text-xs sm:text-base tracking-[0.4em]',
  admin: 'mt-2 text-[10px] sm:text-xs tracking-[0.4em]',
};

const TONE_DIGIT = {
  light: 'text-white',
  dark: 'text-bwai-ink dark:text-neutral-100',
};

const TONE_LABEL = {
  light: 'text-white/80',
  dark: 'text-neutral-500 dark:text-neutral-400',
};

export default function BigCountdown({
  durationSeconds,
  endsAt,
  mode,
  variant = 'public',
  tone = 'light',
}: Props) {
  const units = pickUnits(durationSeconds);
  const liveCount = useCountdown(mode === 'running' ? endsAt : null);
  const total =
    mode === 'running'
      ? liveCount.days * 86400 + liveCount.hours * 3600 + liveCount.minutes * 60 + liveCount.seconds
      : durationSeconds;
  const remaining = mode === 'running' ? totalSecondsRemaining(endsAt) : durationSeconds;
  const values = breakdown(mode === 'running' ? remaining : total, units);

  return (
    <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-8 sm:gap-x-12">
      {units.map((u) => (
        <div key={u} className="flex flex-col items-center">
          <span
            className={`font-mono font-bold leading-none tabular-nums ${DIGIT_BY_VARIANT[variant]} ${TONE_DIGIT[tone]}`}
          >
            {String(values[u]).padStart(2, '0')}
          </span>
          <span
            className={`font-bold uppercase ${LABEL_BY_VARIANT[variant]} ${TONE_LABEL[tone]}`}
          >
            {UNIT_LABEL[u]}
          </span>
        </div>
      ))}
    </div>
  );
}
