import { T } from "../../theme/tokens";

export default function Pill({ children, tone = "muted" }) {
  const tones = {
    muted: { color: T.muted, bg: "#EAE8DF" },
    teal: { color: T.teal, bg: T.tealSoft },
    amber: { color: T.amber, bg: T.amberSoft },
    brick: { color: T.brick, bg: T.brickSoft },
    ink: { color: T.ink, bg: "#E7E5DC" },
  };
  const s = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: s.color, backgroundColor: s.bg, fontFamily: "Inter" }}
    >
      {children}
    </span>
  );
}
