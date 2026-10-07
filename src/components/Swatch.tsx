interface SwatchProps {
  dot: string;
  overlay: string;
}

export function Swatch({ dot, overlay }: SwatchProps) {
  return (
    <span
      className="relative block h-7 w-full overflow-hidden rounded"
      style={{ background: overlay }}
    >
      <span className="absolute inset-1.5 grid grid-cols-4 gap-0.5">
        {Array.from({ length: 16 }, (_, index) => (
          <span key={index} className="rounded-full" style={{ background: dot }} />
        ))}
      </span>

    </span>
  );
}
