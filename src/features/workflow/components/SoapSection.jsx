import { CheckCircle2, XCircle, Edit3 } from "lucide-react";
import { confTier } from "../../../shared/lib/utils";
import { T } from "../../../shared/theme/tokens";
import ConfidenceBadge from "../../../shared/components/ui/ConfidenceBadge";
import CitationChip from "../../../shared/components/ui/CitationChip";
import Pill from "../../../shared/components/ui/Pill";

export default function SoapSection({ sectionKey, label, data, review, onChange, patient, openCitation, setOpenCitation }) {
  const tier = confTier(data.confidence);
  const status = review.status;
  const noteFor = (id) => patient.priorNotes.find((n) => n.id === id);

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: T.line, backgroundColor: T.raised }}
    >
      <div className="flex" style={{ minHeight: 1 }}>
        <div className="w-1.5 shrink-0" style={{ backgroundColor: tier.color }} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="font-semibold">
                {label}
              </h3>
              <ConfidenceBadge value={data.confidence} />
              {status === "rejected" && <Pill tone="brick">Rejected</Pill>}
              {status === "edited" && (
                <Pill tone={review.editTag === "material" ? "brick" : "amber"}>
                  Edited · {review.editTag === "material" ? "material correction" : "minor edit"}
                </Pill>
              )}
              {status === "accepted" && <Pill tone="teal">Accepted as drafted</Pill>}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {data.citations?.map((id) => (
                <CitationChip
                  key={id}
                  id={id}
                  note={noteFor(id)}
                  active={openCitation === `${sectionKey}-${id}`}
                  onToggle={() =>
                    setOpenCitation((cur) => (cur === `${sectionKey}-${id}` ? null : `${sectionKey}-${id}`))
                  }
                />
              ))}
            </div>
          </div>

          {data.citations?.map((id) =>
            openCitation === `${sectionKey}-${id}` && noteFor(id) ? (
              <div
                key={id}
                className="text-xs mb-2 px-3 py-2 rounded-md"
                style={{ backgroundColor: T.paper, color: T.inkSoft, fontFamily: "Inter" }}
              >
                <span style={{ fontFamily: "IBM Plex Mono", color: T.muted }}>{id} · {noteFor(id).date}</span>
                <div className="mt-1">{noteFor(id).text}</div>
              </div>
            ) : null
          )}

          <textarea
            value={review.text}
            onChange={(e) => onChange(sectionKey, "text", e.target.value)}
            rows={3}
            className="w-full text-sm p-2.5 rounded-md border resize-none focus:outline-none focus:ring-2"
            style={{
              fontFamily: "Inter",
              color: T.ink,
              borderColor: status === "rejected" ? T.brick : T.line,
              backgroundColor: status === "rejected" ? T.brickSoft : T.paper,
            }}
          />

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={() => onChange(sectionKey, "status", "accepted")}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border font-medium"
              style={{
                borderColor: status === "accepted" ? T.teal : T.line,
                color: status === "accepted" ? T.teal : T.inkSoft,
                backgroundColor: status === "accepted" ? T.tealSoft : "transparent",
                fontFamily: "Inter",
              }}
            >
              <CheckCircle2 size={13} /> Accept
            </button>
            <button
              onClick={() => onChange(sectionKey, "status", "edited")}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border font-medium"
              style={{
                borderColor: status === "edited" ? T.amber : T.line,
                color: status === "edited" ? T.amber : T.inkSoft,
                backgroundColor: status === "edited" ? T.amberSoft : "transparent",
                fontFamily: "Inter",
              }}
            >
              <Edit3 size={13} /> Mark edited
            </button>
            <button
              onClick={() => onChange(sectionKey, "status", "rejected")}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border font-medium"
              style={{
                borderColor: status === "rejected" ? T.brick : T.line,
                color: status === "rejected" ? T.brick : T.inkSoft,
                backgroundColor: status === "rejected" ? T.brickSoft : "transparent",
                fontFamily: "Inter",
              }}
            >
              <XCircle size={13} /> Reject
            </button>

            {status === "edited" && (
              <div className="flex items-center gap-1.5 ml-2 text-xs" style={{ fontFamily: "Inter", color: T.muted }}>
                Tag:
                <button
                  onClick={() => onChange(sectionKey, "editTag", "minor")}
                  className="px-2 py-0.5 rounded-full border"
                  style={{
                    borderColor: review.editTag === "minor" ? T.amber : T.line,
                    color: review.editTag === "minor" ? T.amber : T.muted,
                  }}
                >
                  Minor
                </button>
                <button
                  onClick={() => onChange(sectionKey, "editTag", "material")}
                  className="px-2 py-0.5 rounded-full border"
                  style={{
                    borderColor: review.editTag === "material" ? T.brick : T.line,
                    color: review.editTag === "material" ? T.brick : T.muted,
                  }}
                >
                  Material clinical correction
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
