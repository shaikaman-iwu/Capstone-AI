import { T } from "../theme/tokens";

export function confTier(c) {
  if (c >= 0.85) return { color: T.teal, bg: T.tealSoft, label: "High" };
  if (c >= 0.6) return { color: T.amber, bg: T.amberSoft, label: "Medium" };
  return { color: T.brick, bg: T.brickSoft, label: "Low" };
}

export function fmtTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
