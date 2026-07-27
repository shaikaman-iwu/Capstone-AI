import { useEffect, useState } from "react";
import { Lock, PlusCircle } from "lucide-react";
import { DEFAULT_PATIENTS } from "./shared/data/patients";
import { seedVisitsForUser } from "./shared/data/history";
import { generateDraft } from "./shared/lib/ai";
import { can, ROLE_LABELS, sanitizeUserForSession } from "./shared/lib/auth";
import { STEPS, SECTIONS } from "./shared/constants";
import { T } from "./shared/theme/tokens";
import { clearStoredAppState, readStoredValue, writeStoredValue } from "./shared/lib/storage";
import { getUserFriendlyError } from "./shared/lib/errorHandling";
import LoginScreen from "./features/auth/components/LoginScreen";
import TopBar from "./features/navigation/components/TopBar";
import Stepper from "./shared/components/ui/Stepper";
import StatusBanner from "./shared/components/ui/StatusBanner";
import RosterScreen from "./features/workflow/components/RosterScreen";
import RecordScreen from "./features/workflow/components/RecordScreen";
import TranscribingScreen from "./features/workflow/components/TranscribingScreen";
import TranscriptScreen from "./features/workflow/components/TranscriptScreen";
import ReviewScreen from "./features/workflow/components/ReviewScreen";
import SignedScreen from "./features/workflow/components/SignedScreen";
import BillingQueueScreen from "./features/billing/components/BillingQueueScreen";
import Dashboard from "./features/dashboard/components/Dashboard";

function emptyReview(draft) {
  const r = {};
  SECTIONS.forEach((s) => {
    r[s.key] = { status: "accepted", editTag: "minor", text: draft[s.key].text };
  });
  return r;
}

export default function App() {
  const persistedState = readStoredValue("mediscribe.appState", null);
  const [user, setUser] = useState(persistedState?.user ?? null);
  const [patients, setPatients] = useState(persistedState?.patients ?? DEFAULT_PATIENTS);
  const [view, setView] = useState(persistedState?.view ?? "workflow");
  const [step, setStep] = useState(persistedState?.step ?? "roster");
  const [activePatient, setActivePatient] = useState(persistedState?.activePatient ?? null);
  const [recordSeconds, setRecordSeconds] = useState(persistedState?.recordSeconds ?? 0);
  const [transcribing, setTranscribing] = useState(persistedState?.transcribing ?? false);
  const [draft, setDraft] = useState(persistedState?.draft ?? null);
  const [generating, setGenerating] = useState(persistedState?.generating ?? false);
  const [genError, setGenError] = useState(persistedState?.genError ?? null);
  const [review, setReview] = useState(persistedState?.review ?? null);
  const [codeAccepted, setCodeAccepted] = useState(persistedState?.codeAccepted ?? []);
  const [visitStart, setVisitStart] = useState(persistedState?.visitStart ?? null);
  const [visits, setVisits] = useState(persistedState?.visits ?? []);
  const [lastSigned, setLastSigned] = useState(persistedState?.lastSigned ?? null);
  const [showPermPanel, setShowPermPanel] = useState(persistedState?.showPermPanel ?? false);
  const [notice, setNotice] = useState(null);

  function showNotice(variant, title, message) {
    setNotice({ variant, title, message });
  }

  function clearNotice() {
    setNotice(null);
  }

  useEffect(() => {
    writeStoredValue("mediscribe.appState", {
      user,
      patients,
      view,
      step,
      activePatient,
      recordSeconds,
      transcribing,
      draft,
      generating,
      genError,
      review,
      codeAccepted,
      visitStart,
      visits,
      lastSigned,
      showPermPanel,
    });
  }, [activePatient, codeAccepted, draft, genError, generating, lastSigned, patients, recordSeconds, review, showPermPanel, step, transcribing, user, visitStart, view, visits]);

  function startVisit(patient) {
    if (!patient?.id) {
      showNotice("error", "Unable to start visit", "Pick a patient before continuing.");
      return;
    }

    try {
      setActivePatient(patient);
      setVisitStart(Date.now());
      setDraft(null);
      setReview(null);
      setGenError(null);
      setStep("record");
      setView("workflow");
      clearNotice();
    } catch (error) {
      showNotice("error", "Unable to start visit", getUserFriendlyError(error, "The workflow could not be started right now."));
    }
  }

  function finishRecording(seconds) {
    if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds < 0) {
      showNotice("error", "Recording incomplete", "The encounter timer was invalid, so the visit could not continue.");
      return;
    }

    try {
      setRecordSeconds(seconds);
      setTranscribing(true);
      clearNotice();
      setTimeout(() => {
        setTranscribing(false);
        setStep("transcript");
      }, 1500);
    } catch (error) {
      showNotice("error", "Recording incomplete", getUserFriendlyError(error, "The recording could not be completed."));
    }
  }

  async function handleGenerate() {
    if (!activePatient?.transcript?.length) {
      showNotice("error", "Draft blocked", "There is no transcript available for this visit yet.");
      return;
    }

    setGenerating(true);
    setGenError(null);
    clearNotice();

    try {
      const result = await generateDraft(activePatient, activePatient.transcript);
      if (!result || typeof result !== "object") {
        throw new Error("The draft response was incomplete.");
      }

      setDraft(result);
      setReview(emptyReview(result));
      setCodeAccepted(result.codes?.map(() => true) ?? []);
      setVisits((v) => [
        ...v,
        {
          id: `session-${Date.now()}`,
          patientId: activePatient.id,
          patientName: activePatient.name,
          provider: user.name,
          signed: false,
          seed: false,
        },
      ]);

      if (result._meta?.source === "local-fallback") {
        setGenError("The AI service was unavailable, so MediScribe used a local fallback draft. Review it carefully before signing.");
        showNotice("info", "Draft created with fallback", "The AI service was unavailable, so MediScribe used a local fallback draft. Review it carefully before signing.");
      } else {
        setGenError(null);
      }

      setStep("review");
    } catch (err) {
      const message = getUserFriendlyError(err, "We couldn't generate a draft from the transcript. Please try again.");
      setGenError(message);
      showNotice("error", "Draft generation failed", message);
    } finally {
      setGenerating(false);
    }
  }

  function handleSectionChange(key, field, value) {
    if (!review) {
      showNotice("error", "Review unavailable", "The review draft is not ready yet.");
      return;
    }

    setReview((r) => ({ ...r, [key]: { ...r[key], [field]: value } }));
  }

  function handleToggleCode(i) {
    if (!Array.isArray(codeAccepted)) return;
    setCodeAccepted((a) => a.map((v, idx) => (idx === i ? !v : v)));
  }

  function handleSign() {
    if (!activePatient || !draft || !review || !visitStart) {
      showNotice("error", "Signature blocked", "The visit draft is incomplete, so the note cannot be signed yet.");
      return;
    }

    try {
      const docMinutes = Math.max((Date.now() - visitStart) / 60000, 0.4);
      const minorEditOnly = SECTIONS.every((s) => {
        const st = review[s.key]?.status;
        if (st === "rejected") return false;
        if (st === "edited" && review[s.key]?.editTag === "material") return false;
        return true;
      });
      setVisits((v) => {
        const copy = [...v];
        const idx = copy.map((x) => x.patientId).lastIndexOf(activePatient.id);
        if (idx >= 0) copy[idx] = { ...copy[idx], signed: true, docMinutes, minorEditOnly, date: new Date().toISOString().slice(0, 10) };
        return copy;
      });
      setLastSigned({ docMinutes, minorEditOnly });
      setStep("signed");
      clearNotice();
    } catch (error) {
      showNotice("error", "Signature blocked", getUserFriendlyError(error, "The note could not be finalized right now."));
    }
  }

  function backToRoster() {
    setStep("roster");
    setActivePatient(null);
    setDraft(null);
    setReview(null);
    setGenError(null);
    clearNotice();
  }

  function handleImportCSV(imported) {
    if (!Array.isArray(imported) || imported.length === 0) {
      showNotice("error", "Import failed", "No patients were found in that file.");
      return;
    }

    try {
      setPatients((p) => [...p, ...imported]);
      showNotice("success", "Roster imported", `${imported.length} patient${imported.length === 1 ? "" : "s"} were added to the roster.`);
    } catch (error) {
      showNotice("error", "Import failed", getUserFriendlyError(error, "The roster could not be imported."));
    }
  }

  function handleLogin(loggedInUser) {
    try {
      const safeUser = sanitizeUserForSession(loggedInUser);
      setUser(safeUser);
      setVisits(seedVisitsForUser(safeUser));
      if (can(safeUser.role, "record_visit")) setView("workflow");
      else if (can(safeUser.role, "view_practice_dashboard")) setView("dashboard");
      else if (can(safeUser.role, "view_billing_queue")) setView("billing");
      else setView("dashboard");
      setStep("roster");
      clearNotice();
    } catch (error) {
      showNotice("error", "Sign-in failed", getUserFriendlyError(error, "We couldn't open your workspace right now."));
    }
  }

  function handleLogout() {
    clearStoredAppState();
    setUser(null);
    setView("workflow");
    setStep("roster");
    setActivePatient(null);
    setDraft(null);
    setReview(null);
    setVisits([]);
    setLastSigned(null);
    setRecordSeconds(0);
    setTranscribing(false);
    setGenerating(false);
    setGenError(null);
    setCodeAccepted([]);
    setVisitStart(null);
    setShowPermPanel(false);
    clearNotice();
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const stepperKey = step === "roster" ? "roster" : step === "record" ? "record" : step === "transcript" ? "transcript" : step === "review" ? "review" : "signed";
  const backlogCount = visits.filter((v) => !v.signed).length;

  return (
    <div style={{ backgroundColor: T.paper, minHeight: "100%" }} className="min-h-screen overflow-x-hidden">
      <TopBar
        user={user}
        view={view}
        onViewChange={setView}
        onLogout={handleLogout}
        showPermPanel={showPermPanel}
        setShowPermPanel={setShowPermPanel}
      />

      {view === "workflow" && can(user.role, "record_visit") && step !== "roster" && (
        <div className="border-b" style={{ borderColor: T.line, backgroundColor: T.raised }}>
          <div className="max-w-5xl mx-auto px-3 py-3 sm:px-5">
            <Stepper steps={STEPS.filter((s) => s.key !== "roster")} current={stepperKey} />
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-3 py-4 sm:px-5 sm:py-8">
        {notice && (
          <div className="mb-4">
            <StatusBanner variant={notice.variant} title={notice.title} message={notice.message} />
          </div>
        )}

        {view === "billing" && can(user.role, "view_billing_queue") ? (
          <BillingQueueScreen visits={visits} />
        ) : view === "dashboard" || !can(user.role, "record_visit") ? (
          can(user.role, "view_own_dashboard") || can(user.role, "view_practice_dashboard") ? (
            <Dashboard
              visits={visits}
              backlogCount={backlogCount}
              mode={can(user.role, "view_practice_dashboard") ? "practice" : "personal"}
              providerName={user.name}
            />
          ) : (
            <div className="text-center py-20" style={{ color: T.muted, fontFamily: "Inter" }}>
              <Lock className="mx-auto mb-2" size={20} />
              <p className="text-sm">
                Your role ({ROLE_LABELS[user.role]}) doesn't have a dashboard view.
              </p>
            </div>
          )
        ) : step === "roster" ? (
          <RosterScreen
            patients={patients}
            onImportCSV={handleImportCSV}
            onStartVisit={startVisit}
            backlogCount={backlogCount}
            canManageRoster={can(user.role, "manage_roster")}
          />
        ) : step === "record" ? (
          <RecordScreen patient={activePatient} onFinish={finishRecording} onCancel={backToRoster} />
        ) : step === "transcript" && transcribing ? (
          <TranscribingScreen />
        ) : step === "transcript" ? (
          <TranscriptScreen
            patient={activePatient}
            transcript={activePatient.transcript}
            recordSeconds={recordSeconds}
            onGenerate={handleGenerate}
            generating={generating}
            error={genError}
          />
        ) : step === "review" && draft && review ? (
          <ReviewScreen
            patient={activePatient}
            draft={draft}
            review={review}
            onSectionChange={handleSectionChange}
            codeAccepted={codeAccepted}
            onToggleCode={handleToggleCode}
            onSign={handleSign}
            canSign={can(user.role, "sign_note")}
          />
        ) : step === "signed" && lastSigned ? (
          <SignedScreen
            patient={activePatient}
            docMinutes={lastSigned.docMinutes}
            minorEditOnly={lastSigned.minorEditOnly}
            onBackToRoster={backToRoster}
          />
        ) : (
          <div className="text-center py-20" style={{ color: T.muted, fontFamily: "Inter" }}>
            <PlusCircle className="mx-auto mb-2" />
            Something interrupted the workflow — back to roster.
            <div className="mt-3">
              <button onClick={backToRoster} className="px-4 py-2 rounded-md" style={{ backgroundColor: T.ink, color: T.paper }}>
                Back to roster
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
