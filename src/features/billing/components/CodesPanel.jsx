import { ClipboardList, CheckCircle2 } from "lucide-react";
import { confTier } from "../../../shared/lib/utils";
import { T } from "../../../shared/theme/tokens";
import Pill from "../../../shared/components/ui/Pill";

export default function CodesPanel({ codes, accepted, onToggle }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: T.line, backgroundColor: T.raised }}>
      <h3 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="font-semibold mb-3 flex items-center gap-2">
        <ClipboardList size={16} /> Suggested billing codes
      </h3>
      <div className="space-y-2">
        {codes.map((c, i) => {
          const tier = confTier(c.confidence);
          const isOn = accepted[i];
          return (
            <div
              key={i}
              className="flex items-center justify-between gap-3 p-2.5 rounded-md border"
              style={{ borderColor: T.line }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => onToggle(i)}
                  className="h-5 w-5 rounded border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: isOn ? T.teal : T.line, backgroundColor: isOn ? T.teal : "transparent" }}
                >
                  {isOn && <CheckCircle2 size={13} color="#fff" />}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: "IBM Plex Mono", color: T.ink }} className="text-sm font-semibold">{c.code}</span>
                    <Pill tone="ink">{c.system}</Pill>
                  </div>
                  <div style={{ fontFamily: "Inter", color: T.inkSoft }} className="text-xs truncate">{c.label}</div>
                </div>
              </div>
              <div className="shrink-0 w-28">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.line }}>
                  <div className="h-full rounded-full" style={{ width: `${c.confidence * 100}%`, backgroundColor: tier.color }} />
                </div>
                <div style={{ fontFamily: "IBM Plex Mono", color: tier.color }} className="text-[10px] mt-0.5 text-right">
                  {Math.round(c.confidence * 100)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
