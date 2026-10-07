import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

const buttonClassName =
  'h-11 w-14 rounded-md text-sm font-semibold text-white/80 hover:bg-white/10 aria-pressed:bg-accent-400 aria-pressed:text-night-900 forced-colors:aria-pressed:bg-[Highlight] forced-colors:aria-pressed:text-[HighlightText]';

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1 font-sans backdrop-blur-md"
    >
      <button
        type="button"
        aria-pressed={unit === 'celsius'}
        onClick={() => onChange('celsius')}
        className={buttonClassName}
      >
        {'\u00b0C'}
      </button>
      <button
        type="button"
        aria-pressed={unit === 'fahrenheit'}
        onClick={() => onChange('fahrenheit')}
        className={buttonClassName}
      >
        {'\u00b0F'}
      </button>
    </div>
  );
}
