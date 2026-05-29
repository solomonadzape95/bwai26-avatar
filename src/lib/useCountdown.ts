import { useEffect, useState } from 'react';

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  finished: boolean;
};

function compute(target: Date | null): Countdown {
  if (!target) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, finished: true };
  }
  const totalMs = Math.max(0, target.getTime() - Date.now());
  const totalSec = Math.floor(totalMs / 1000);
  return {
    totalMs,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    finished: totalMs === 0,
  };
}

export function useCountdown(target: Date | null): Countdown {
  const [state, setState] = useState<Countdown>(() => compute(target));

  useEffect(() => {
    setState(compute(target));
    if (!target) return;
    const id = setInterval(() => setState(compute(target)), 1000);
    return () => clearInterval(id);
  }, [target?.getTime()]);

  return state;
}
