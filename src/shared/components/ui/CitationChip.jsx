import { Quote } from "lucide-react";
import { T } from "../../theme/tokens";

export default function CitationChip({ id, note, active, onToggle }) {
  if (!note) return <span className="text-xs" style={{ color: T.muted }}>[{id}]</span>;
  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-mono border transition-colors"
      style={{
        borderColor: active ? T.teal : T.line,
        color: active ? T.teal : T.inkSoft,
        backgroundColor: active ? T.tealSoft : "transparent",
        fontFamily: "IBM Plex Mono",
      }}
      title={`Prior note ${id} — ${note.date}`}
    >
      <Quote size={11} /> {id}
    </button>
  );
}
