import React from "react";
import { CheckCircle2 } from "lucide-react";
import { T } from "../../theme/tokens";

export default function Stepper({ steps, current }) {
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center w-full overflow-x-auto">
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.key}>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold border-2 shrink-0"
                style={{
                  borderColor: active || done ? T.ink : T.line,
                  backgroundColor: active ? T.ink : done ? T.tealSoft : "transparent",
                  color: active ? T.paper : done ? T.teal : T.muted,
                  fontFamily: "IBM Plex Mono",
                }}
              >
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span
                className="text-sm whitespace-nowrap"
                style={{
                  color: active ? T.ink : done ? T.inkSoft : T.muted,
                  fontFamily: "Inter",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px flex-1 mx-3 min-w-[16px]" style={{ backgroundColor: T.line }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
