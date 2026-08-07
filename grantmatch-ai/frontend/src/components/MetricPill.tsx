type MetricPillProps = {
  label: string;
  value: string;
};

export default function MetricPill({ label, value }: MetricPillProps) {
  return (
    <div className="rounded-full border border-white/60 bg-white/70 px-4 py-3 text-sm text-ink shadow-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-moss/75">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
