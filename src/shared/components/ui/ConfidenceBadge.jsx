import { confTier } from "../../lib/utils";

export default function ConfidenceBadge({ value }) {
  const tier = confTier(value);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: tier.color, backgroundColor: tier.bg, fontFamily: "IBM Plex Mono" }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tier.color }} />
      {Math.round(value * 100)}% · {tier.label}
    </span>
  );
}
