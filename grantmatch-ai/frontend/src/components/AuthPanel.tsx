import { LoaderCircle, LockKeyhole, UserPlus2 } from "lucide-react";
import type { LoginForm, RegisterForm } from "../types";
import FieldHint from "./FieldHint";
import StatusMessage from "./StatusMessage";

type AuthPanelProps = {
  mode: "login" | "register";
  loginForm: LoginForm;
  registerForm: RegisterForm;
  loginErrors: Partial<Record<keyof LoginForm, string>>;
  registerErrors: Partial<Record<keyof RegisterForm, string>>;
  authError: string | null;
  authLoading: boolean;
  onModeChange: (mode: "login" | "register") => void;
  onLoginChange: <K extends keyof LoginForm>(key: K, value: LoginForm[K]) => void;
  onRegisterChange: <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => void;
  onLoginSubmit: () => void;
  onRegisterSubmit: () => void;
};

export default function AuthPanel({
  mode,
  loginForm,
  registerForm,
  loginErrors,
  registerErrors,
  authError,
  authLoading,
  onModeChange,
  onLoginChange,
  onRegisterChange,
  onLoginSubmit,
  onRegisterSubmit,
}: AuthPanelProps) {
  const register = mode === "register";
  const sanitizedName = registerForm.name.replace(/[^A-Za-z\s]/g, "");

  return (
    <section className="mx-auto w-full max-w-xl rounded-[32px] border border-white/60 bg-paper/95 p-6 shadow-glow backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-moss/75">Secure workspace</p>
          <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">{register ? "Create your account" : "Sign in to GrantMatch AI"}</h1>
        </div>
        <div className="inline-flex rounded-full bg-sand/80 p-1">
          <button type="button" onClick={() => onModeChange("login")} className={`rounded-full px-4 py-2 text-sm font-semibold ${!register ? "bg-white text-ink shadow-sm" : "text-ink/65"}`}>Sign in</button>
          <button type="button" onClick={() => onModeChange("register")} className={`rounded-full px-4 py-2 text-sm font-semibold ${register ? "bg-white text-ink shadow-sm" : "text-ink/65"}`}>Register</button>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-ink/70">Use the demo account `director@grantmatch.demo` with password `grantmatch-demo`, or create a local user stored in the project database.</p>
      {authError ? <div className="mt-4"><StatusMessage variant="error" message={authError} /></div> : null}

      {register ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-ink">Full name
            <input value={sanitizedName} onChange={(event) => onRegisterChange("name", event.target.value.replace(/[^A-Za-z\s]/g, ""))} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
            <FieldHint error={registerErrors.name} />
          </label>
          <label className="text-sm font-medium text-ink">Organization
            <input value={registerForm.organization} onChange={(event) => onRegisterChange("organization", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
            <FieldHint error={registerErrors.organization} />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-ink">Email
            <input type="email" value={registerForm.email} onChange={(event) => onRegisterChange("email", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
            <FieldHint error={registerErrors.email} />
          </label>
          <label className="text-sm font-medium text-ink">Password
            <input type="password" value={registerForm.password} onChange={(event) => onRegisterChange("password", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
            <FieldHint error={registerErrors.password} />
          </label>
          <label className="text-sm font-medium text-ink">Confirm password
            <input type="password" value={registerForm.confirmPassword} onChange={(event) => onRegisterChange("confirmPassword", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
            <FieldHint error={registerErrors.confirmPassword} />
          </label>
          <button type="button" onClick={onRegisterSubmit} disabled={authLoading} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {authLoading ? <LoaderCircle className="animate-spin" size={16} /> : <UserPlus2 size={16} />}
            {authLoading ? "Creating account..." : "Create account"}
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          <label className="text-sm font-medium text-ink">Email
            <input type="email" value={loginForm.email} onChange={(event) => onLoginChange("email", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
            <FieldHint error={loginErrors.email} />
          </label>
          <label className="text-sm font-medium text-ink">Password
            <input type="password" value={loginForm.password} onChange={(event) => onLoginChange("password", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
            <FieldHint error={loginErrors.password} />
          </label>
          <button type="button" onClick={onLoginSubmit} disabled={authLoading} className="inline-flex items-center justify-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {authLoading ? <LoaderCircle className="animate-spin" size={16} /> : <LockKeyhole size={16} />}
            {authLoading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      )}
    </section>
  );
}
