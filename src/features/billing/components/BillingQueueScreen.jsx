import { useState } from "react";
import { confTier } from "../../../shared/lib/utils";
import { T } from "../../../shared/theme/tokens";
import Pill from "../../../shared/components/ui/Pill";

export default function BillingQueueScreen({ visits }) {
  const [decisions, setDecisions] = useState({});

  const rows = [];
  visits.forEach((v) => {
    if (!v.signed) return;
    if (!v.codes || v.codes.length === 0) {
      rows.push({ key: `${v.id}-missing`, provider: v.provider, patientName: v.patientName, date: v.date, missing: true });
    } else {
      v.codes.forEach((c, i) => {
        rows.push({ key: `${v.id}-${i}`, provider: v.provider, patientName: v.patientName, date: v.date, ...c });
      });
    }
  });

  const flaggedCount = rows.filter((r) => r.missing || r.confidence < 0.7).length;
  const decidedCount = Object.keys(decisions).length;

  function decide(key, decision) {
    setDecisions((d) => ({ ...d, [key]: decision }));
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-2xl font-semibold mb-1">
        Billing queue
      </h2>
      <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-sm mb-1">
        Codes and confidence only — clinical note text isn't part of this view.
      </p>
      <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-xs mb-5">
        {rows.length} code{rows.length === 1 ? "" : "s"} across the practice ·{" "}
        <span style={{ color: T.brick }}>{flaggedCount} need attention</span> · {decidedCount} reviewed this session
      </p>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: T.line, backgroundColor: T.raised }}>
        <table className="w-full text-sm" style={{ fontFamily: "Inter" }}>
          <thead>
            <tr style={{ color: T.muted, backgroundColor: T.paper }} className="text-left text-xs">
              <th className="px-4 py-2 font-medium">Patient</th>
              <th className="px-4 py-2 font-medium">Provider</th>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Confidence</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const decision = decisions[r.key];
              if (r.missing) {
                return (
                  <tr key={r.key} className="border-t" style={{ borderColor: T.line, backgroundColor: T.brickSoft }}>
                    <td className="px-4 py-2.5" style={{ color: T.ink }}>{r.patientName}</td>
                    <td className="px-4 py-2.5" style={{ color: T.muted }}>{r.provider}</td>
                    <td className="px-4 py-2.5" colSpan={2} style={{ color: T.brick, fontWeight: 500 }}>
                      No codes captured for this visit
                    </td>
                    <td className="px-4 py-2.5">—</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => decide(r.key, "flagged")}
                        disabled={decision === "flagged"}
                        className="text-xs px-2.5 py-1 rounded-md border font-medium disabled:opacity-50"
                        style={{ borderColor: T.brick, color: T.brick, fontFamily: "Inter" }}
                      >
                        {decision === "flagged" ? "Flagged" : "Flag to provider"}
                      </button>
                    </td>
                  </tr>
                );
              }
              const tier = confTier(r.confidence);
              const needsAttention = r.confidence < 0.7;
              return (
                <tr key={r.key} className="border-t" style={{ borderColor: T.line, backgroundColor: needsAttention ? T.amberSoft : "transparent" }}>
                  <td className="px-4 py-2.5" style={{ color: T.ink }}>{r.patientName}</td>
                  <td className="px-4 py-2.5" style={{ color: T.muted }}>{r.provider}</td>
                  <td className="px-4 py-2.5">
                    <span style={{ fontFamily: "IBM Plex Mono", color: T.ink, fontWeight: 600 }}>{r.code}</span>
                    <Pill tone="ink"> {r.system}</Pill>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: T.inkSoft }}>{r.label}</td>
                  <td className="px-4 py-2.5">
                    <span style={{ color: tier.color, fontFamily: "IBM Plex Mono", fontWeight: 600 }}>
                      {Math.round(r.confidence * 100)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => decide(r.key, "confirmed")}
                      disabled={decision === "confirmed"}
                      className="text-xs px-2.5 py-1 rounded-md border font-medium mr-1.5 disabled:opacity-50"
                      style={{ borderColor: T.teal, color: T.teal, fontFamily: "Inter" }}
                    >
                      {decision === "confirmed" ? "Confirmed" : "Confirm"}
                    </button>
                    <button
                      onClick={() => decide(r.key, "flagged")}
                      disabled={decision === "flagged"}
                      className="text-xs px-2.5 py-1 rounded-md border font-medium disabled:opacity-50"
                      style={{ borderColor: T.brick, color: T.brick, fontFamily: "Inter" }}
                    >
                      {decision === "flagged" ? "Flagged" : "Flag"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
