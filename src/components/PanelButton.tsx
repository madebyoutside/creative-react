interface PanelButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  prominent?: boolean;
}

export function PanelButton({
  children,
  onClick,
  prominent = false,
}: PanelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border border-line bg-raised px-3 text-sm transition-colors hover:border-muted ${
        prominent ? "py-2" : "py-1.5"
      }`}
    >
      {children}
    </button>
  );
}
