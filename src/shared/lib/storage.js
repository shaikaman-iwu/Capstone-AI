function createSafeStorageEnvelope(value) {
  return {
    version: 1,
    payload: value,
    storedAt: new Date().toISOString(),
  };
}

export function sanitizeStateForStorage(state) {
  if (!state || typeof state !== "object") return state;

  const sanitized = { ...state };

  if (sanitized.user && typeof sanitized.user === "object") {
    const { password, token, ...userWithoutSecrets } = sanitized.user;
    sanitized.user = userWithoutSecrets;
  }

  if (Array.isArray(sanitized.patients)) {
    sanitized.patients = sanitized.patients.map((patient) => {
      const { transcript, priorNotes, problemList, ...rest } = patient || {};
      return rest;
    });
  }

  if (sanitized.activePatient && typeof sanitized.activePatient === "object") {
    const { transcript, problemList, ...activePatientWithoutSensitiveFields } = sanitized.activePatient;
    sanitized.activePatient = activePatientWithoutSensitiveFields;
  }

  if (sanitized.draft) delete sanitized.draft;
  if (sanitized.review) delete sanitized.review;

  return sanitized;
}

export function readStoredValue(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.version === 1 && Object.prototype.hasOwnProperty.call(parsed, "payload")) {
      return parsed.payload ?? fallback;
    }
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredValue(key, value) {
  if (typeof window === "undefined") return;
  const safeValue = sanitizeStateForStorage(value);
  const payload = createSafeStorageEnvelope(safeValue);
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function removeStoredValue(key) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function clearStoredAppState() {
  if (typeof window === "undefined") return;
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith("mediscribe"))
    .forEach((key) => window.localStorage.removeItem(key));
}
