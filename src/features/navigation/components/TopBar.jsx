import {
  Stethoscope, FileText, LayoutDashboard, ClipboardList, LogOut, Building2, Info,
} from "lucide-react";
import { can, ROLE_LABELS } from "../../../shared/lib/auth";
import { T } from "../../../shared/theme/tokens";
import Pill from "../../../shared/components/ui/Pill";
import RolePermissionsPanel from "../../permissions/components/RolePermissionsPanel";

export default function TopBar({ user, view, onViewChange, onLogout, showPermPanel, setShowPermPanel }) {
  return (
    <div className="border-b" style={{ borderColor: T.line, backgroundColor: T.raised }}>
      <div className="max-w-5xl mx-auto px-3 py-3 sm:px-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Stethoscope size={20} style={{ color: T.teal }} />
          <span style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-lg font-semibold">
            MediScribe
          </span>
          <Pill tone="muted">Prototype</Pill>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(user.role, "record_visit") && (
            <button
              onClick={() => onViewChange("workflow")}
              className="text-sm px-3 py-1.5 rounded-md flex items-center gap-1.5"
              style={{
                fontFamily: "Inter",
                color: view === "workflow" ? T.ink : T.muted,
                backgroundColor: view === "workflow" ? T.paper : "transparent",
                fontWeight: view === "workflow" ? 600 : 500,
              }}
            >
              <FileText size={15} /> Visit
            </button>
          )}
          {(can(user.role, "view_own_dashboard") || can(user.role, "view_practice_dashboard")) && (
            <button
              onClick={() => onViewChange("dashboard")}
              className="text-sm px-3 py-1.5 rounded-md flex items-center gap-1.5"
              style={{
                fontFamily: "Inter",
                color: view === "dashboard" ? T.ink : T.muted,
                backgroundColor: view === "dashboard" ? T.paper : "transparent",
                fontWeight: view === "dashboard" ? 600 : 500,
              }}
            >
              <LayoutDashboard size={15} /> Dashboard
            </button>
          )}
          {can(user.role, "view_billing_queue") && (
            <button
              onClick={() => onViewChange("billing")}
              className="text-sm px-3 py-1.5 rounded-md flex items-center gap-1.5"
              style={{
                fontFamily: "Inter",
                color: view === "billing" ? T.ink : T.muted,
                backgroundColor: view === "billing" ? T.paper : "transparent",
                fontWeight: view === "billing" ? 600 : 500,
              }}
            >
              <ClipboardList size={15} /> Billing queue
            </button>
          )}

          <div className="relative flex flex-wrap items-center gap-2 ml-0 sm:ml-2 pl-0 sm:pl-3 sm:border-l" style={{ borderColor: T.line }}>
            <button
              onClick={() => setShowPermPanel((s) => !s)}
              className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
              style={{ backgroundColor: T.tealSoft, color: T.teal, fontFamily: "IBM Plex Mono" }}
              title="View role permissions"
            >
              {user.initials}
            </button>
            <div className="leading-tight">
              <div style={{ fontFamily: "Inter", color: T.ink }} className="text-sm font-medium flex items-center gap-1.5">
                {user.name}
                <button onClick={() => setShowPermPanel((s) => !s)} title="View role permissions" style={{ color: T.muted }}>
                  <Info size={12} />
                </button>
              </div>
              <div style={{ fontFamily: "Inter", color: T.muted }} className="text-[11px] flex items-center gap-1">
                <Building2 size={10} /> {user.org} · {ROLE_LABELS[user.role]}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1.5 rounded-md ml-1"
              style={{ color: T.muted }}
            >
              <LogOut size={15} />
            </button>
            {showPermPanel && <RolePermissionsPanel user={user} onClose={() => setShowPermPanel(false)} />}
          </div>
        </div>
      </div>
    </div>
  );
}
