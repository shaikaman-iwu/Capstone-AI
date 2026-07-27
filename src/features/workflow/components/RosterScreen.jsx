import { useRef, useState } from "react";
import { Upload, ChevronRight, Lock, X } from "lucide-react";
import { DEFAULT_PATIENTS } from "../../../shared/data/patients";
import { T } from "../../../shared/theme/tokens";
import Pill from "../../../shared/components/ui/Pill";
import StatusBanner from "../../../shared/components/ui/StatusBanner";

export default function RosterScreen({ patients, onImportCSV, onStartVisit, backlogCount, canManageRoster = true }) {
  const fileRef = useRef(null);
  const [showSample, setShowSample] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importState, setImportState] = useState({ type: "idle", message: "" });
  const SAMPLE_CSV = "name,mrn,dob,chief\nSam Torres,MRN-10021,1990-01-05,Annual physical\nLinh Pham,MRN-10022,1955-07-19,Hypertension follow-up";

  function sanitizeCsvValue(value) {
    return String(value ?? "")
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .trim()
      .replace(/^[=+\-@]/, "");
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setImportState({ type: "error", message: "Choose a CSV file before importing." });
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportState({ type: "error", message: "Only CSV files are supported for roster imports." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImportState({ type: "error", message: "The selected file is too large. Please keep it under 2 MB." });
      return;
    }

    setImportState({ type: "loading", message: `Reading ${file.name}…` });
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const rows = text.split(/\r?\n/).filter(Boolean);
        if (rows.length < 2) {
          throw new Error("The CSV appears to be empty.");
        }
        const header = rows[0].split(",").map((h) => h.trim().toLowerCase());
        const missingColumns = ["name", "mrn", "dob", "chief"].filter((col) => !header.includes(col));
        if (missingColumns.length) {
          throw new Error(`The CSV is missing required columns: ${missingColumns.join(", ")}`);
        }
        const nameIdx = header.indexOf("name");
        const mrnIdx = header.indexOf("mrn");
        const dobIdx = header.indexOf("dob");
        const chiefIdx = header.indexOf("chief");
        const imported = rows.slice(1).map((row, i) => {
          const cols = row.split(",");
          return {
            id: `CSV-${i}-${Date.now()}`,
            name: sanitizeCsvValue(cols[nameIdx]) || `Imported Patient ${i + 1}`,
            mrn: sanitizeCsvValue(cols[mrnIdx]) || "—",
            dob: sanitizeCsvValue(cols[dobIdx]) || "—",
            chief: sanitizeCsvValue(cols[chiefIdx]) || "General follow-up",
            problemList: ["Imported from roster — no problem list on file"],
            priorNotes: [],
            transcript: DEFAULT_PATIENTS[i % DEFAULT_PATIENTS.length].transcript,
          };
        });
        onImportCSV(imported);
        setImportState({ type: "success", message: `${imported.length} patient${imported.length === 1 ? "" : "s"} imported successfully.` });
      } catch (err) {
        setImportState({ type: "error", message: err.message || "Unable to import that CSV file." });
      }
    };
    reader.onerror = () => {
      setImportState({ type: "error", message: "The selected file could not be read." });
    };
    reader.readAsText(file);
  }

  async function copySample() {
    try {
      await navigator.clipboard.writeText(SAMPLE_CSV);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-3xl font-semibold">
            Today's roster
          </h1>
          <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-sm mt-1">
            Select a patient to start a visit. {backlogCount > 0 && (
              <span style={{ color: T.amber }}>{backlogCount} note{backlogCount > 1 ? "s" : ""} awaiting signature.</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 relative">
          {canManageRoster ? (
            <>
              <button
                onClick={() => setShowSample((s) => !s)}
                className="text-xs px-3 py-2 rounded-md border"
                style={{ borderColor: T.line, color: T.inkSoft, fontFamily: "Inter" }}
              >
                Sample CSV
              </button>
              {showSample && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 rounded-lg border shadow-lg z-20 p-4"
                  style={{ backgroundColor: T.raised, borderColor: T.line }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-sm font-semibold">
                      Sample roster CSV
                    </span>
                    <button onClick={() => setShowSample(false)} style={{ color: T.muted }}>
                      <X size={14} />
                    </button>
                  </div>
                  <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-xs mb-2">
                    Downloads are blocked in this preview — copy the text below into a .csv file instead.
                  </p>
                  <textarea
                    readOnly
                    value={SAMPLE_CSV}
                    rows={4}
                    onFocus={(e) => e.target.select()}
                    className="w-full text-xs p-2 rounded-md border resize-none"
                    style={{ fontFamily: "IBM Plex Mono", color: T.ink, borderColor: T.line, backgroundColor: T.paper }}
                  />
                  <button
                    onClick={copySample}
                    className="mt-2 w-full text-xs px-3 py-2 rounded-md font-medium"
                    style={{ backgroundColor: T.ink, color: T.paper, fontFamily: "Inter" }}
                  >
                    {copied ? "Copied ✓" : "Copy to clipboard"}
                  </button>
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs px-3 py-2 rounded-md flex items-center gap-1.5 font-medium"
                style={{ backgroundColor: T.ink, color: T.paper, fontFamily: "Inter" }}
              >
                <Upload size={14} /> Import roster (CSV)
              </button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
              <button
                disabled
                title="Fast-follow: connect directly to your EHR via FHIR"
                className="text-xs px-3 py-2 rounded-md border flex items-center gap-1.5 cursor-not-allowed opacity-60"
                style={{ borderColor: T.line, color: T.muted, fontFamily: "Inter" }}
              >
                FHIR connect · coming soon
              </button>
            </>
          ) : (
            <span
              className="text-xs px-3 py-2 rounded-md border flex items-center gap-1.5"
              style={{ borderColor: T.line, color: T.muted, fontFamily: "Inter" }}
            >
              <Lock size={12} /> Roster management restricted to your role
            </span>
          )}
        </div>
      </div>

      {importState.type !== "idle" && (
        <div className="mb-4">
          <StatusBanner
            variant={importState.type}
            title={importState.type === "loading" ? "Importing roster" : importState.type === "success" ? "Roster imported" : "Import failed"}
            message={importState.message}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {patients.map((p) => (
          <button
            key={p.id}
            onClick={() => onStartVisit(p)}
            className="text-left p-4 rounded-lg border hover:shadow-md transition-shadow group"
            style={{ backgroundColor: T.raised, borderColor: T.line }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-lg font-semibold">
                  {p.name}
                </div>
                <div style={{ color: T.muted, fontFamily: "IBM Plex Mono" }} className="text-xs mt-0.5">
                  {p.mrn} · DOB {p.dob}
                </div>
              </div>
              <ChevronRight size={18} style={{ color: T.muted }} className="group-hover:translate-x-0.5 transition-transform mt-1" />
            </div>
            <div style={{ color: T.inkSoft, fontFamily: "Inter" }} className="text-sm mt-3">
              {p.chief}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {p.problemList.slice(0, 3).map((pr, i) => (
                <Pill key={i} tone="ink">{pr}</Pill>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
