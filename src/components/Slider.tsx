interface SliderProps {
  id: string;
  label?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function Slider({
  id,
  label,
  min,
  max,
  step,
  value,
  unit,
  onChange,
}: SliderProps) {
  const shown = unit !== undefined ? `${value}${unit}` : value.toFixed(step < 1 ? 1 : 0);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        {label === undefined ? (
          <span className="text-xs tabular-nums text-muted">{shown}</span>
        ) : (
          <>
            <label htmlFor={id} className="text-sm">
              {label}
            </label>

            <span className="text-xs tabular-nums text-muted">{shown}</span>

          </>
        )}
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5"
      />
    </div>
  );
}
