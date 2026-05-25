import { useCallback, useEffect, useRef } from 'react';
import { STYLE_OPTIONS } from '../lib/styles';

type Props = {
  selectedId: number;
  onSelect: (id: number) => void;
};

const CARD = 128;
const GAP = 20;
const STEP = CARD + GAP;

export function StylePicker({ selectedId, onSelect }: Props) {
  const total = STYLE_OPTIONS.length;
  const idx = Math.max(
    0,
    STYLE_OPTIONS.findIndex((s) => s.id === selectedId),
  );
  const current = STYLE_OPTIONS[idx];

  const go = useCallback(
    (nextIdx: number) => {
      const clamped = Math.max(0, Math.min(total - 1, nextIdx));
      onSelect(STYLE_OPTIONS[clamped].id);
    },
    [onSelect, total],
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startIdx: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (!el.contains(document.activeElement)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(idx - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(idx + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, go]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: e.clientX, startIdx: idx };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const delta = Math.round(-dx / STEP);
    const next = dragRef.current.startIdx + delta;
    if (next !== idx) go(next);
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div ref={wrapperRef} className="select-none">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Choose a style
        </h2>
        <span className="text-xs font-medium text-neutral-500">
          {idx + 1} / {total} · {current.name}
        </span>
      </div>

      <div className="relative">
        <ArrowButton
          direction="left"
          disabled={idx === 0}
          onClick={() => go(idx - 1)}
          ariaLabel="Previous style"
        />

        <div
          className="relative mx-12 h-44 touch-pan-y overflow-hidden"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="absolute left-1/2 top-1/2 flex items-center transition-transform duration-300 ease-out"
            style={{
              gap: `${GAP}px`,
              transform: `translate(-${idx * STEP + CARD / 2}px, -50%)`,
            }}
          >
            {STYLE_OPTIONS.map((style, i) => {
              const active = i === idx;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={style.name}
                  aria-current={active ? 'true' : undefined}
                  className={`relative shrink-0 rounded-2xl bg-white transition-all duration-300 ${
                    active
                      ? 'shadow-xl ring-2 ring-bwai-blue ring-offset-2 ring-offset-neutral-50'
                      : 'opacity-60 ring-1 ring-neutral-200 hover:opacity-90'
                  }`}
                  style={{
                    width: `${CARD}px`,
                    height: `${CARD}px`,
                    transform: active ? 'scale(1.05)' : 'scale(0.85)',
                  }}
                >
                  <div className="absolute inset-3 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200" />
                  <img
                    src={style.url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain p-1"
                    draggable={false}
                  />
                  {active && (
                    <span className="absolute -top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-bwai-blue text-white shadow-md">
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,8 7,12 13,4" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <ArrowButton
          direction="right"
          disabled={idx === total - 1}
          onClick={() => go(idx + 1)}
          ariaLabel="Next style"
        />
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {STYLE_OPTIONS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Style ${i + 1}: ${s.name}`}
            aria-current={i === idx ? 'true' : undefined}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? 'w-6 bg-bwai-blue' : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
  ariaLabel,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-bwai-ink shadow-md ring-1 ring-neutral-200 transition disabled:cursor-not-allowed disabled:opacity-30 hover:enabled:bg-neutral-50 ${
        direction === 'left' ? 'left-0' : 'right-0'
      }`}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === 'left' ? (
          <polyline points="10,3 5,8 10,13" />
        ) : (
          <polyline points="6,3 11,8 6,13" />
        )}
      </svg>
    </button>
  );
}
