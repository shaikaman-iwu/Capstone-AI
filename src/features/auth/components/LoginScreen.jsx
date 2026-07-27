import { useState } from "react";
import {
  Stethoscope, Lock, AlertCircle, Loader2, KeyRound, Eye, EyeOff,
} from "lucide-react";
import { DEMO_USERS } from "../../../shared/data/users";
import { ROLE_LABELS, sanitizeUserForSession } from "../../../shared/lib/auth";
import { makeSessionToken } from "../../../shared/lib/auth";
import { T } from "../../../shared/theme/tokens";
import Pill from "../../../shared/components/ui/Pill";
import StatusBanner from "../../../shared/components/ui/StatusBanner";

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  function attemptLogin(e) {
    e?.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail) {
      setError("Please enter your work email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid work email address.");
      return;
    }
    if (!trimmedPassword) {
      setError("Please enter your password.");
      return;
    }

    setError(null);
    setChecking(true);
    setTimeout(() => {
      const match = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === trimmedEmail.toLowerCase()
      );
      if (!match) {
        setError("No account found for that email in this demo practice directory.");
        setChecking(false);
        return;
      }
      if (trimmedPassword !== match.password) {
        setError("Incorrect password.");
        setChecking(false);
        return;
      }
      setChecking(false);
      onLogin({ ...sanitizeUserForSession(match), token: makeSessionToken(), loggedInAt: Date.now() });
    }, 650);
  }

  function quickFill(u) {
    setEmail(u.email);
    setPassword(u.password);
    setError(null);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: T.paper, fontFamily: "Inter" }}
    >
      <div className="w-full max-w-md px-1 sm:px-0">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Stethoscope size={22} style={{ color: T.teal }} />
          <span style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-xl font-semibold">
            MediScribe
          </span>
          <Pill tone="muted">Prototype</Pill>
        </div>

        <div className="rounded-xl border p-4 sm:p-6" style={{ backgroundColor: T.raised, borderColor: T.line }}>
          <div className="flex items-center gap-2 mb-1">
            <Lock size={16} style={{ color: T.inkSoft }} />
            <h1 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-lg font-semibold">
              Sign in to your practice
            </h1>
          </div>
          <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-xs mb-4">
            This demo uses local-only credentials and does not transmit real secrets. Use the demo accounts below to continue.
          </p>

          <div className="space-y-3">
            <div>
              <label style={{ fontFamily: "Inter", color: T.inkSoft }} className="text-xs font-medium block mb-1">
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && attemptLogin(e)}
                placeholder="you@yourclinic.com"
                className="w-full text-sm px-3 py-2.5 rounded-md border focus:outline-none focus:ring-2"
                style={{ borderColor: T.line, color: T.ink, backgroundColor: T.paper, fontFamily: "Inter" }}
                autoComplete="username"
              />
            </div>
            <div>
              <label style={{ fontFamily: "Inter", color: T.inkSoft }} className="text-xs font-medium block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && attemptLogin(e)}
                  placeholder="••••••••"
                  className="w-full text-sm px-3 py-2.5 pr-9 rounded-md border focus:outline-none focus:ring-2"
                  style={{ borderColor: T.line, color: T.ink, backgroundColor: T.paper, fontFamily: "Inter" }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: T.muted }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs">
                <StatusBanner variant="error" title="Sign-in issue" message={error} />
              </div>
            )}

            {checking && (
              <StatusBanner variant="info" title="Authenticating" message="Checking your demo credentials and opening your workspace…" />
            )}

            <button
              type="button"
              onClick={attemptLogin}
              disabled={checking || !email || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium disabled:opacity-60"
              style={{ backgroundColor: T.ink, color: T.paper, fontFamily: "Inter" }}
            >
              {checking ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
              {checking ? "Verifying…" : "Sign in"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border p-3 sm:p-4" style={{ backgroundColor: T.raised, borderColor: T.line }}>
          <div style={{ fontFamily: "Inter", color: T.muted }} className="text-xs mb-2 font-medium">
            Demo accounts (password: pajama-time)
          </div>
          <div className="space-y-1.5">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                onClick={() => quickFill(u)}
                className="w-full flex items-center justify-between gap-2 text-left px-2.5 py-2 rounded-md border hover:border-current transition-colors"
                style={{ borderColor: T.line }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                    style={{ backgroundColor: T.tealSoft, color: T.teal, fontFamily: "IBM Plex Mono" }}
                  >
                    {u.initials}
                  </div>
                  <div className="min-w-0">
                    <div style={{ fontFamily: "Inter", color: T.ink }} className="text-xs font-medium truncate">
                      {u.name}
                    </div>
                    <div style={{ fontFamily: "Inter", color: T.muted }} className="text-[11px] truncate">
                      {u.org}
                    </div>
                  </div>
                </div>
                <Pill tone={u.role === "physician" ? "teal" : u.role === "manager" ? "amber" : "ink"}>
                  {ROLE_LABELS[u.role]}
                </Pill>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
