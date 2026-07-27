import { Loader2, Sparkles } from "lucide-react";
import { T } from "../../../shared/theme/tokens";
import { fmtTime } from "../../../shared/lib/utils";
import StatusBanner from "../../../shared/components/ui/StatusBanner";

export default function TranscriptScreen({ patient, transcript, recordSeconds, onGenerate, generating, error }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-2xl font-semibold">
            Transcript
          </h2>
          <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-sm">
            {patient.name} · recorded {fmtTime(recordSeconds)}
          </p>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md font-medium disabled:opacity-60"
          style={{ backgroundColor: T.teal, color: "#fff", fontFamily: "Inter" }}
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generating ? "Drafting note…" : "Generate AI draft"}
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <StatusBanner variant="error" title="Draft generation failed" message={error} />
        </div>
      )}

      {generating && (
        <div className="mb-4">
          <StatusBanner variant="info" title="Generating your draft" message="MediScribe is building a SOAP note from the visit transcript and prior chart context." />
        </div>
      )}

      <div className="rounded-lg border p-4 space-y-3 max-h-[440px] overflow-y-auto" style={{ backgroundColor: T.raised, borderColor: T.line }}>
        {transcript.map(([speaker, text], i) => {
          const clinician = speaker === "Clinician";
          return (
            <div key={i} className={`flex ${clinician ? "justify-start" : "justify-end"}`}>
              <div className="max-w-[80%]">
                <div
                  className="text-[11px] font-semibold mb-1 uppercase tracking-wide"
                  style={{ color: clinician ? T.teal : T.amber, fontFamily: "IBM Plex Mono" }}
                >
                  {speaker}
                </div>
                <div
                  className="text-sm px-3 py-2 rounded-lg"
                  style={{
                    fontFamily: "Inter",
                    color: T.ink,
                    backgroundColor: clinician ? T.tealSoft : T.amberSoft,
                  }}
                >
                  {text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
