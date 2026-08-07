import { CalendarDays, CircleDollarSign, Sparkles } from "lucide-react";
import type { GrantMatch } from "../types";

type MatchCardProps = {
  match: GrantMatch;
  active: boolean;
  onSelect: (match: GrantMatch) => void;
};

export default function MatchCard({ match, active, onSelect }: MatchCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(match)}
      className={`w-full rounded-[24px] border p-5 text-left transition hover:-translate-y-0.5 ${
        active ? "border-moss bg-moss text-white shadow-glow" : "border-[#d9d1c3] bg-white/90 text-ink"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`font-mono text-[11px] uppercase tracking-[0.22em] ${active ? "text-white/70" : "text-moss/70"}`}>
            {match.funder}
          </p>
          <h3 className="mt-2 text-xl font-semibold">{match.title}</h3>
        </div>
        <div className={`rounded-full px-3 py-2 text-sm font-semibold ${active ? "bg-white/15" : "bg-sand text-moss"}`}>
          {match.fitScore}% fit
        </div>
      </div>

      <div className={`mt-4 flex flex-wrap gap-3 text-sm ${active ? "text-white/85" : "text-ink/75"}`}>
        <span className="inline-flex items-center gap-2"><CircleDollarSign size={16} /> ${match.amountMin.toLocaleString()} - ${match.amountMax.toLocaleString()}</span>
        <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> {match.deadline}</span>
        <span className="inline-flex items-center gap-2"><Sparkles size={16} /> {match.fitLabel}</span>
      </div>

      <p className={`mt-4 text-sm leading-6 ${active ? "text-white/90" : "text-ink/80"}`}>{match.recommendedUse}</p>
    </button>
  );
}
