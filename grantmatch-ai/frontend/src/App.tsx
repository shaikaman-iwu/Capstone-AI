import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, Building2, CheckCircle2, FileText, HeartHandshake, LoaderCircle, LogOut, Radar, ShieldCheck, Target } from "lucide-react";
import AuthPanel from "./components/AuthPanel";
import DeadlineRail from "./components/DeadlineRail";
import FieldHint from "./components/FieldHint";
import MatchCard from "./components/MatchCard";
import MetricPill from "./components/MetricPill";
import SectionCard from "./components/SectionCard";
import StatusMessage from "./components/StatusMessage";
import { fetchCurrentUser, fetchGrantCatalogAuthenticated, fetchServiceStatus, generateNarrative, login, rankMatches, register } from "./lib/api";
import { validateCsvField, validateLogin, validateProfile, validateRegister } from "./lib/validation";
import type { DraftResponse, GrantMatch, GrantRecord, LoginForm, OrganizationProfile, RegisterForm, ServiceStatus, User } from "./types";

const AUTH_STORAGE_KEY = "grantmatch.auth";

const defaultProfile: OrganizationProfile = {
  name: "Southside Youth Table",
  mission: "We connect teens and young adults to mentorship, meals, and after-school leadership programs in neighborhoods with high food insecurity.",
  location: "Chicago, IL",
  annualBudget: 420000,
  staffCount: 8,
  serviceRegions: ["Chicago", "Cook County"],
  focusAreas: ["Youth mentorship", "Food access", "Community health"],
  populationsServed: ["Teens", "Low-income families", "First-generation students"],
  programs: "Daily supper club, weekend family pantry pop-ups, peer mentorship cohorts, and workforce readiness workshops.",
  recentOutcomes: "Served 680 youth last year, delivered 42,000 meals, and placed 94 students into paid internships or summer jobs.",
  fundingNeeds: "Program expansion for two new meal sites, part-time case management support, and technology stipends for mentors.",
};

const technicalStack = [
  "React + TypeScript + Tailwind dashboard for fast iteration",
  "FastAPI backend for async-friendly retrieval and drafting routes",
  "Validated data models for users, saved grants, and draft history",
  "OpenAI or Anthropic integration with deterministic fallback when keys are missing",
  "Docker, Nginx, GitHub Actions, and Cloud Run deployment scaffolding",
];

const keyFeatures = [
  "Semantic grant matching to replace brittle keyword search",
  "Plain-language eligibility summaries for dense funder guidelines",
  "Grounded first-draft narrative generation using organization profile data",
  "Authentication, protected API access, and persistent saved-grant records",
];

const targetUsers = [
  "Executive or program directors at 1-15 person non-profits",
  "Volunteer or part-time grant writers who need a strong first draft quickly",
];

function toCommaSeparated(values: string[]) {
  return values.join(", ");
}

function fromCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readStoredAuth(): { token: string; user: User } | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { token: string; user: User }) : null;
  } catch {
    return null;
  }
}

function writeStoredAuth(value: { token: string; user: User } | null) {
  if (!value) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
}

export default function App() {
  const storedAuth = readStoredAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [token, setToken] = useState<string | null>(storedAuth?.token ?? null);
  const [user, setUser] = useState<User | null>(storedAuth?.user ?? null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: "director@grantmatch.demo", password: "grantmatch-demo" });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({ name: "", organization: "", email: "", password: "", confirmPassword: "" });
  const [loginErrors, setLoginErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [registerErrors, setRegisterErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [profile, setProfile] = useState<OrganizationProfile>(defaultProfile);
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof OrganizationProfile, string>>>({});
  const [catalog, setCatalog] = useState<GrantRecord[]>([]);
  const [matches, setMatches] = useState<GrantMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<GrantMatch | null>(null);
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [ranking, setRanking] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceStatus()
      .then(setServiceStatus)
      .catch((err: Error) => setServiceError(err.message));
  }, []);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    fetchCurrentUser(token)
      .then((currentUser) => {
        setUser(currentUser);
        writeStoredAuth({ token, user: currentUser });
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        writeStoredAuth(null);
      });
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    setLoadingCatalog(true);
    fetchGrantCatalogAuthenticated(token)
      .then((items) => setCatalog(items))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingCatalog(false));
  }, [token]);

  const topMatch = selectedMatch ?? matches[0] ?? null;

  const portfolioSummary = useMemo(() => {
    if (!catalog.length) {
      return loadingCatalog ? "Loading grant corpus" : "No grants loaded yet";
    }

    const urgent = catalog.filter((grant) => {
      const days = Math.ceil((new Date(grant.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 30;
    }).length;

    return `${catalog.length} live opportunities indexed, ${urgent} due in the next 30 days`;
  }, [catalog, loadingCatalog]);

  function updateProfileField<Key extends keyof OrganizationProfile>(key: Key, value: OrganizationProfile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setProfileErrors((current) => ({ ...current, [key]: undefined }));
  }

  function updateCsvField(key: "serviceRegions" | "focusAreas" | "populationsServed", value: string, label: string) {
    updateProfileField(key, fromCommaSeparated(value));
    setProfileErrors((current) => ({ ...current, [key]: validateCsvField(value, label) }));
  }

  async function handleLoginSubmit() {
    const errors = validateLogin(loginForm);
    setLoginErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await login(loginForm);
      setToken(response.token);
      setUser(response.user);
      writeStoredAuth(response);
      setSuccessMessage(`Signed in as ${response.user.name}.`);
      setError(null);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegisterSubmit() {
    const errors = validateRegister(registerForm);
    setRegisterErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await register(registerForm);
      setToken(response.token);
      setUser(response.user);
      writeStoredAuth(response);
      setProfile((current) => ({ ...current, name: response.user.organization }));
      setSuccessMessage(`Account created for ${response.user.organization}.`);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setCatalog([]);
    setMatches([]);
    setDraft(null);
    setSelectedMatch(null);
    setSuccessMessage("Signed out.");
    writeStoredAuth(null);
  }

  async function handleRankMatches() {
    const validation = validateProfile(profile);
    setProfileErrors(validation);
    if (Object.values(validation).some(Boolean)) {
      setError("Fix the highlighted organization profile fields before ranking grants.");
      return;
    }

    if (!token) {
      setError("Sign in before ranking grants.");
      return;
    }

    setRanking(true);
    setError(null);
    setDraft(null);
    setSuccessMessage(null);

    try {
      const result = await rankMatches(profile, token);
      setMatches(result.matches);
      setSelectedMatch(result.matches[0] ?? null);
      setSuccessMessage(`Ranked ${result.matches.length} grant opportunities.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to rank grants.");
    } finally {
      setRanking(false);
    }
  }

  async function handleGenerateDraft() {
    if (!topMatch) {
      setError("Select a matched grant before generating a draft.");
      return;
    }

    if (!token) {
      setError("Sign in before generating a draft.");
      return;
    }

    setDrafting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await generateNarrative(profile, topMatch.id, token);
      setDraft(result);
      setSuccessMessage(`Generated a draft for ${result.grantTitle}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate narrative.");
    } finally {
      setDrafting(false);
    }
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_rgba(244,239,230,0.92)_42%,_rgba(205,228,219,0.6)_100%)] px-4 py-8 text-ink sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-moss/75">GrantMatch AI</p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">Protected grant matching for non-profits that do not have time for research-heavy funding hunts.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/75 sm:text-lg">The app now includes local authentication, validated profile intake, protected backend routes, and resilient loading and error handling so the workflow behaves like a full-stack product instead of a static mock.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <MetricPill label="Auth" value={serviceStatus?.authEnabled ? "Protected API routes" : "Demo mode"} />
              <MetricPill label="AI provider" value={serviceStatus?.aiProvider ?? "Loading status"} />
              <MetricPill label="Validation" value="Client + API schema checks" />
            </div>
            <div className="mt-6 space-y-3">
              {serviceError ? <StatusMessage variant="error" message={serviceError} /> : null}
              {serviceStatus ? <StatusMessage variant="info" message={`Backend status: ${serviceStatus.aiProvider}${serviceStatus.hasLiveAi ? " is live" : " fallback mode active"}.`} /> : null}
            </div>
          </div>
          <AuthPanel
            mode={authMode}
            loginForm={loginForm}
            registerForm={registerForm}
            loginErrors={loginErrors}
            registerErrors={registerErrors}
            authError={authError}
            authLoading={authLoading}
            onModeChange={setAuthMode}
            onLoginChange={(key, value) => setLoginForm((current) => ({ ...current, [key]: value }))}
            onRegisterChange={(key, value) => setRegisterForm((current) => ({ ...current, [key]: value }))}
            onLoginSubmit={handleLoginSubmit}
            onRegisterSubmit={handleRegisterSubmit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_rgba(244,239,230,0.92)_42%,_rgba(205,228,219,0.6)_100%)] text-ink">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="relative overflow-hidden rounded-[30px] border border-white/60 bg-[linear-gradient(135deg,#17362d_0%,#285746_55%,#d56f4d_100%)] p-5 text-white shadow-glow sm:p-7 lg:p-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.22),_transparent_65%)] lg:block" />
          <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/75">Grant discovery for small non-profits</p>
                  <h1 className="mt-4 max-w-3xl font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">GrantMatch AI turns a multi-day grant search into a same-day shortlist and first draft.</h1>
                </div>
                <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                  <LogOut size={16} /> Sign out
                </button>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/85 sm:text-lg">Signed in as {user.name} at {user.organization}. This workflow validates inputs, protects API routes, and persists users plus saved-grant history in the database layer.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <MetricPill label="Business goal" value="50%+ faster grant search" />
                <MetricPill label="Primary user" value="Program or executive director" />
                <MetricPill label="AI mode" value={serviceStatus?.aiProvider ?? "Loading"} />
              </div>
            </div>
            <div className="grid gap-3 self-start">
              <div className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/75">Problem snapshot</p>
                <p className="mt-3 text-lg font-semibold">Needle-in-a-haystack grant research is blocking program growth.</p>
                <p className="mt-3 text-sm leading-6 text-white/80">Directors lose time reading dense PDF guidelines, miss deadlines, and fall back to the same few funders. GrantMatch AI narrows the list to genuinely eligible opportunities and explains why they fit.</p>
              </div>
              <div className="rounded-[24px] border border-white/15 bg-[#fff7ef] p-5 text-ink">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-moss/75">Live corpus status</p>
                <p className="mt-3 text-xl font-semibold sm:text-2xl">{portfolioSummary}</p>
                <p className="mt-3 text-sm leading-6 text-ink/75">Backend AI provider: {serviceStatus?.aiProvider ?? "loading"}. {serviceStatus?.hasLiveAi ? "Live LLM integration available." : "Fallback draft generation active until API keys are configured."}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            {error ? <StatusMessage variant="error" message={error} /> : null}
            {successMessage ? <StatusMessage variant="success" message={successMessage} /> : null}

            <SectionCard eyebrow="Company and users" title="Why this product exists">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-[24px] bg-sand/80 p-5">
                  <div className="flex items-center gap-3 text-moss"><HeartHandshake size={18} /><span className="font-semibold">Target users</span></div>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/80">
                    {targetUsers.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-[24px] bg-sand/80 p-5">
                  <div className="flex items-center gap-3 text-moss"><BrainCircuit size={18} /><span className="font-semibold">AI solution</span></div>
                  <p className="mt-4 text-sm leading-6 text-ink/80">A RAG pipeline ingests grant text, retrieves relevant opportunities, summarizes eligibility in plain language, and drafts first-pass narratives grounded in the organization profile rather than generic fundraising copy.</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Profile intake"
              title="Organization profile"
              action={
                <button type="button" onClick={handleRankMatches} disabled={ranking} className="inline-flex items-center gap-2 rounded-full bg-moss px-4 py-3 text-sm font-semibold text-white transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-70">
                  {ranking ? <LoaderCircle className="animate-spin" size={16} /> : <Radar size={16} />}
                  {ranking ? "Ranking grants..." : "Generate ranked matches"}
                </button>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-ink">Organization name
                  <input value={profile.name} onChange={(event) => updateProfileField("name", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
                  <FieldHint error={profileErrors.name} />
                </label>
                <label className="text-sm font-medium text-ink">Location
                  <input value={profile.location} onChange={(event) => updateProfileField("location", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
                  <FieldHint error={profileErrors.location} />
                </label>
                <label className="text-sm font-medium text-ink">Annual budget
                  <input type="number" min={1} value={profile.annualBudget} onChange={(event) => updateProfileField("annualBudget", Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
                  <FieldHint error={profileErrors.annualBudget} />
                </label>
                <label className="text-sm font-medium text-ink">Staff count
                  <input type="number" min={1} value={profile.staffCount} onChange={(event) => updateProfileField("staffCount", Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
                  <FieldHint error={profileErrors.staffCount} />
                </label>
                <label className="md:col-span-2 text-sm font-medium text-ink">Mission
                  <textarea value={profile.mission} onChange={(event) => updateProfileField("mission", event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
                  <FieldHint error={profileErrors.mission} />
                </label>
                <label className="md:col-span-2 text-sm font-medium text-ink">Programs
                  <textarea value={profile.programs} onChange={(event) => updateProfileField("programs", event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
                  <FieldHint error={profileErrors.programs} />
                </label>
                <label className="md:col-span-2 text-sm font-medium text-ink">Recent outcomes
                  <textarea value={profile.recentOutcomes} onChange={(event) => updateProfileField("recentOutcomes", event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
                  <FieldHint error={profileErrors.recentOutcomes} />
                </label>
                <label className="md:col-span-2 text-sm font-medium text-ink">Funding needs
                  <textarea value={profile.fundingNeeds} onChange={(event) => updateProfileField("fundingNeeds", event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
                  <FieldHint error={profileErrors.fundingNeeds} />
                </label>
                <label className="text-sm font-medium text-ink">Service regions
                  <input value={toCommaSeparated(profile.serviceRegions)} onChange={(event) => updateCsvField("serviceRegions", event.target.value, "Service regions")} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
                  <FieldHint error={profileErrors.serviceRegions} hint="Comma separated, for example Chicago, Cook County" />
                </label>
                <label className="text-sm font-medium text-ink">Focus areas
                  <input value={toCommaSeparated(profile.focusAreas)} onChange={(event) => updateCsvField("focusAreas", event.target.value, "Focus areas")} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
                  <FieldHint error={profileErrors.focusAreas} hint="Comma separated, for example Youth mentorship, Food access" />
                </label>
                <label className="md:col-span-2 text-sm font-medium text-ink">Populations served
                  <input value={toCommaSeparated(profile.populationsServed)} onChange={(event) => updateCsvField("populationsServed", event.target.value, "Populations served")} className="mt-2 w-full rounded-2xl border border-[#d9d1c3] bg-white px-4 py-3" />
                  <FieldHint error={profileErrors.populationsServed} hint="Comma separated, for example Teens, Low-income families" />
                </label>
              </div>
            </SectionCard>

            <SectionCard eyebrow="Architecture" title="Technical stack and feature fit">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-[24px] bg-[#eef5f0] p-5">
                  <div className="flex items-center gap-3 text-moss"><Building2 size={18} /><span className="font-semibold">Technical stack</span></div>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/80">
                    {technicalStack.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-[24px] bg-[#fff4ee] p-5">
                  <div className="flex items-center gap-3 text-[#9c4a2d]"><Target size={18} /><span className="font-semibold">Key features</span></div>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/80">
                    {keyFeatures.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard eyebrow="Runtime" title="Feature readiness and service state">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-sand/80 p-5">
                  <div className="flex items-center gap-3 text-moss"><ShieldCheck size={18} /><span className="font-semibold">Authentication</span></div>
                  <p className="mt-3 text-sm leading-6 text-ink/80">Protected backend routes require a session token. Local sign-in and registration are persisted in the project database.</p>
                </div>
                <div className="rounded-[24px] bg-sand/80 p-5">
                  <div className="flex items-center gap-3 text-moss"><CheckCircle2 size={18} /><span className="font-semibold">Error handling</span></div>
                  <p className="mt-3 text-sm leading-6 text-ink/80">Client and server validation surface actionable messages for invalid input, auth issues, and service failures.</p>
                </div>
              </div>
              {serviceStatus ? <StatusMessage variant="info" message={`AI provider: ${serviceStatus.aiProvider}. ${serviceStatus.hasLiveAi ? "Live API configured." : "Local fallback is active until OPENAI_API_KEY or ANTHROPIC_API_KEY is set."}`} /> : null}
            </SectionCard>

            <SectionCard eyebrow="Grant ranking" title="AI-matched opportunities">
              <div className="space-y-4">
                {loadingCatalog ? (
                  <div className="rounded-[24px] border border-dashed border-[#d9d1c3] bg-white/60 p-6 text-sm leading-6 text-ink/70">Loading the protected grant catalog...</div>
                ) : matches.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-[#d9d1c3] bg-white/60 p-6 text-sm leading-6 text-ink/70">Submit the organization profile to rank grant opportunities by mission fit, eligibility, geography, and budget alignment.</div>
                ) : (
                  matches.map((match) => <MatchCard key={match.id} match={match} active={topMatch?.id === match.id} onSelect={setSelectedMatch} />)
                )}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Eligibility and drafting"
              title={topMatch ? topMatch.title : "Grant detail"}
              action={
                <button type="button" onClick={handleGenerateDraft} disabled={!topMatch || drafting} className="inline-flex items-center gap-2 rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                  {drafting ? <LoaderCircle className="animate-spin" size={16} /> : <FileText size={16} />}
                  {drafting ? "Drafting..." : "Generate first draft"}
                </button>
              }
            >
              {topMatch ? (
                <div className="space-y-5">
                  <DeadlineRail deadline={topMatch.deadline} />
                  <div className="rounded-[24px] bg-[#eef5f0] p-5">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-moss/75">Plain-language eligibility</p>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/80">
                      {topMatch.eligibilitySummary.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-[24px] bg-white p-5">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-moss/75">Why this is a fit</p>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/80">
                      {topMatch.rationale.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    <p className="mt-4 text-sm leading-6 text-ink/75"><span className="font-semibold text-ink">Application format:</span> {topMatch.applicationFormat}</p>
                  </div>
                  {draft ? (
                    <div className="rounded-[24px] bg-[#10261f] p-5 text-white">
                      <div className="flex items-center gap-2 text-white/80"><CheckCircle2 size={18} /><span className="font-semibold">AI-assisted narrative draft</span></div>
                      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/88">{draft.narrative}</p>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/65">Talking points</p>
                          <ul className="mt-3 space-y-2 text-sm text-white/85">
                            {draft.talkingPoints.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/65">Next steps</p>
                          <ul className="mt-3 space-y-2 text-sm text-white/85">
                            {draft.nextSteps.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[#d9d1c3] bg-white/60 p-5 text-sm leading-6 text-ink/70">Generate a first draft grounded in the organization profile and the selected grant. The backend will use live LLM APIs when configured and fall back to deterministic draft generation otherwise.</div>
                  )}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-[#d9d1c3] bg-white/60 p-6 text-sm leading-6 text-ink/70">Ranked grant details will appear here after the first matching run.</div>
              )}
            </SectionCard>

            <SectionCard eyebrow="Workflow" title="How the MVP maps to the business problem">
              <div className="grid gap-4">
                {[
                  "Profile intake captures mission, programs, outcomes, geography, and funding needs once.",
                  "Grant retrieval and ranking narrow thousands of records to the best-fit shortlist.",
                  "Eligibility summaries reduce time lost reading dense PDF guidance.",
                  "Deadline tracking lowers the risk of missing time-sensitive opportunities.",
                  "First-draft generation removes the blank-page problem for lean teams.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[20px] bg-sand/75 p-4 text-sm leading-6 text-ink/80">
                    <ArrowRight className="mt-1 shrink-0 text-moss" size={16} />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}
