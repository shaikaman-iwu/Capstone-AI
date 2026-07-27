import { useState } from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { SECTIONS } from "../../../shared/constants";
import { T } from "../../../shared/theme/tokens";
import SoapSection from "./SoapSection";
import CodesPanel from "../../billing/components/CodesPanel";
import StatusBanner from "../../../shared/components/ui/StatusBanner";

export default function ReviewScreen({ patient, draft, review, onSectionChange, codeAccepted, onToggleCode, onSign, canSign = true }) {
  const [openCitation, setOpenCitation] = useState(null);
  const [validationError, setValidationError] = useState(null);

  function handleSign() {
    const missingText = SECTIONS.some((s) => !review[s.key].text?.trim());
    if (missingText) {
      setValidationError("Every SOAP section needs draft text before the note can be signed.");
      return;
    }
    if (!codeAccepted.some(Boolean)) {
      setValidationError("Select at least one billing code before finalizing the note.");
      return;
    }
    setValidationError(null);
    onSign();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-2xl font-semibold">
          Review before signing
        </h2>
        <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-sm">
          {patient.name} · AI-drafted from today's visit and {patient.priorNotes.length} prior note{patient.priorNotes.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((s) => (
          <SoapSection
            key={s.key}
            sectionKey={s.key}
            label={s.label}
            data={draft[s.key]}
            review={review[s.key]}
            onChange={onSectionChange}
            patient={patient}
            openCitation={openCitation}
            setOpenCitation={setOpenCitation}
          />
        ))}
      </div>

      {validationError && (
        <div className="mt-4">
          <StatusBanner variant="error" title="Signature blocked" message={validationError} />
        </div>
      )}

      <div className="mt-4">
        <CodesPanel codes={draft.codes} accepted={codeAccepted} onToggle={onToggleCode} />
      </div>

      <div className="flex justify-end mt-5">
        <button
          onClick={handleSign}
          disabled={!canSign}
          title={canSign ? undefined : "Your role can't sign notes — a physician needs to finalize this visit."}
          className="flex items-center gap-2 px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: T.ink, color: T.paper, fontFamily: "Inter" }}
        >
          {canSign ? <ShieldCheck size={17} /> : <Lock size={17} />}
          {canSign ? "Sign & finalize note" : "Signature requires a physician"}
        </button>
      </div>
    </div>
  );
}
