import { useEffect, useState } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';

const KEY = 'bwai26.theme';

function systemDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function effective(pref: ThemePref): 'light' | 'dark' {
  return pref === 'system' ? (systemDark() ? 'dark' : 'light') : pref;
}

function apply(pref: ThemePref) {
  if (typeof document === 'undefined') return;
  const cls = effective(pref);
  document.documentElement.classList.toggle('dark', cls === 'dark');
}

export function readTheme(): ThemePref {
  if (typeof window === 'undefined') return 'system';
  const raw = window.localStorage.getItem(KEY);
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

export function writeTheme(t: ThemePref) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, t);
  apply(t);
}

export function initTheme() {
  apply(readTheme());
}

export function useTheme(): [ThemePref, (t: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(() => readTheme());

  useEffect(() => {
    apply(pref);
    if (pref !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  function update(next: ThemePref) {
    writeTheme(next);
    setPref(next);
  }
  return [pref, update];
}
