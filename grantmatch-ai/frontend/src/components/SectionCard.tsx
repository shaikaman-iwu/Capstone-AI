import type { PropsWithChildren, ReactNode } from "react";

type SectionCardProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
}>;

export default function SectionCard({ eyebrow, title, action, className = "", children }: SectionCardProps) {
  return (
    <section className={`rounded-[28px] border border-white/60 bg-paper/90 p-6 shadow-glow backdrop-blur ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          {eyebrow ? <p className="mb-2 font-mono text-xs uppercase tracking-[0.28em] text-moss/80">{eyebrow}</p> : null}
          <h2 className="font-display text-2xl text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
