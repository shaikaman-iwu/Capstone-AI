import { ShieldCheck } from "lucide-react";
import { BASELINE_MIN } from "../../../shared/constants";
import { T } from "../../../shared/theme/tokens";
import Pill from "../../../shared/components/ui/Pill";

export default function SignedScreen({ patient, docMinutes, minorEditOnly, onBackToRoster }) {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div
        className="h-14 w-14 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: T.tealSoft }}
      >
        <ShieldCheck size={26} style={{ color: T.teal }} />
      </div>
      <h2 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-2xl font-semibold mt-4">
        Note signed for {patient.name}
      </h2>
      <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-sm mt-2">
        Documentation time for this visit: <b style={{ color: T.ink }}>{docMinutes.toFixed(1)} min</b>
        {" "}(baseline {BASELINE_MIN} min).
      </p>
      <Pill tone={minorEditOnly ? "teal" : "amber"}>
        {minorEditOnly ? "Minor edits only — no material corrections" : "Material corrections were made"}
      </Pill>
      <div className="mt-6">
        <button
          onClick={onBackToRoster}
          className="px-5 py-2.5 rounded-md font-medium"
          style={{ backgroundColor: T.ink, color: T.paper, fontFamily: "Inter" }}
        >
          Back to roster
        </button>
      </div>
    </div>
  );
}
