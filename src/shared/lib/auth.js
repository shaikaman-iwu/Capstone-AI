export const PERMISSIONS = {
  physician: ["record_visit", "sign_note", "manage_roster", "view_own_dashboard"],
  manager: ["view_practice_dashboard", "view_provider_breakdown", "manage_roster"],
  billing: ["view_billing_queue"],
};

export const ROLE_LABELS = {
  physician: "Physician",
  manager: "Practice manager",
  billing: "Billing specialist",
};

export const ROLE_DESCRIPTIONS = {
  physician: [
    "Record, transcribe, and draft notes for your own visits",
    "Review, edit, and sign AI-drafted SOAP notes",
    "View your personal documentation-time dashboard",
    "Import your patient roster",
  ],
  manager: [
    "View practice-wide documentation & time metrics",
    "Compare documentation time and note quality across providers",
    "Cannot view clinical note content or sign notes",
  ],
  billing: [
    "Review AI-suggested billing codes across the practice",
    "Confirm codes or flag them back to the provider",
    "Cannot view clinical note text — codes and confidence only",
  ],
};

export function can(role, permission) {
  return (PERMISSIONS[role] || []).includes(permission);
}

export function sanitizeUserForSession(user) {
  if (!user || typeof user !== "object") return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

export function makeSessionToken() {
  const randomBytes = typeof crypto !== "undefined" && crypto.getRandomValues
    ? crypto.getRandomValues(new Uint8Array(8))
    : null;
  const randomPart = randomBytes ? Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("") : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `sess_${randomPart}`;
}
