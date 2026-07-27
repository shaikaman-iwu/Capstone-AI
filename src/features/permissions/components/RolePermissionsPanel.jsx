import { ShieldQuestion, X, Lock, CheckCircle2 } from "lucide-react";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "../../../shared/lib/auth";
import { T } from "../../../shared/theme/tokens";

export default function RolePermissionsPanel({ user, onClose }) {
  return (
    <div
      className="absolute right-0 top-full mt-2 w-72 rounded-lg border shadow-lg z-20 p-4"
      style={{ backgroundColor: T.raised, borderColor: T.line }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <ShieldQuestion size={15} style={{ color: T.teal }} />
          <span style={{ fontFamily: "Source Serif 4", color: T.ink }} className="font-semibold text-sm">
            {ROLE_LABELS[user.role]} access
          </span>
        </div>
        <button onClick={onClose} style={{ color: T.muted }}>
          <X size={14} />
        </button>
      </div>
      <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-xs mb-3">
        Signed in as {user.name} · {user.org}
      </p>
      <ul className="space-y-1.5">
        {(ROLE_DESCRIPTIONS[user.role] || []).map((line, i) => {
          const restricted = line.toLowerCase().startsWith("cannot");
          return (
            <li key={i} className="flex items-start gap-2 text-xs" style={{ fontFamily: "Inter", color: T.inkSoft }}>
              {restricted ? (
                <Lock size={12} className="mt-0.5 shrink-0" style={{ color: T.brick }} />
              ) : (
                <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color: T.teal }} />
              )}
              <span>{line}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
