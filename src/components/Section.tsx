import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className="border-b border-line px-4 py-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
        {title}
      </h2>

      <div className="mt-3 space-y-3">{children}</div>

    </section>
  );
}
