import type { Shape } from '../lib/composite';

type Props = {
  value: Shape;
  onChange: (shape: Shape) => void;
};

export function ShapeToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1 text-xs font-semibold">
      <ShapeButton active={value === 'circle'} onClick={() => onChange('circle')}>
        <CircleIcon />
        Circle
      </ShapeButton>
      <ShapeButton active={value === 'square'} onClick={() => onChange('square')}>
        <SquareIcon />
        Square
      </ShapeButton>
    </div>
  );
}

function ShapeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
        active ? 'bg-bwai-blue text-white shadow-sm' : 'text-neutral-600 hover:text-bwai-ink'
      }`}
    >
      {children}
    </button>
  );
}

function CircleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="8" r="6" />
    </svg>
  );
}

function SquareIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
    </svg>
  );
}
