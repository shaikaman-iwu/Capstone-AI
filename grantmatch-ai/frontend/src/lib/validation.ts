import type { LoginForm, OrganizationProfile, RegisterForm } from "../types";

export type ValidationErrors<T extends string> = Partial<Record<T, string>>;

function requireText(value: string, label: string, minLength = 3) {
  if (!value.trim()) {
    return `${label} is required.`;
  }
  if (value.trim().length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }
  return undefined;
}

function requireAlphabeticName(value: string, label: string) {
  const baseError = requireText(value, label);
  if (baseError) {
    return baseError;
  }

  if (!/^[A-Za-z ]+$/.test(value.trim())) {
    return `${label} must contain letters only.`;
  }

  return undefined;
}

function requirePositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    return `${label} must be greater than 0.`;
  }
  return undefined;
}

function requireCsv(value: string, label: string) {
  if (!value.split(",").map((item) => item.trim()).filter(Boolean).length) {
    return `${label} must include at least one item.`;
  }
  return undefined;
}

export function validateProfile(profile: OrganizationProfile): ValidationErrors<keyof OrganizationProfile> {
  return {
    name: requireText(profile.name, "Organization name"),
    mission: requireText(profile.mission, "Mission", 10),
    location: requireText(profile.location, "Location"),
    annualBudget: requirePositive(profile.annualBudget, "Annual budget"),
    staffCount: requirePositive(profile.staffCount, "Staff count"),
    programs: requireText(profile.programs, "Programs", 10),
    recentOutcomes: requireText(profile.recentOutcomes, "Recent outcomes", 10),
    fundingNeeds: requireText(profile.fundingNeeds, "Funding needs", 10),
    serviceRegions: profile.serviceRegions.length ? undefined : "Service regions must include at least one item.",
    focusAreas: profile.focusAreas.length ? undefined : "Focus areas must include at least one item.",
    populationsServed: profile.populationsServed.length ? undefined : "Populations served must include at least one item.",
  };
}

export function validateRegister(form: RegisterForm): ValidationErrors<keyof RegisterForm> {
  const emailError = !/^\S+@\S+\.\S+$/.test(form.email) ? "Email must be valid." : undefined;
  const passwordError = form.password.length < 8 ? "Password must be at least 8 characters." : undefined;
  const confirmError = form.confirmPassword !== form.password ? "Passwords must match." : undefined;

  return {
    name: requireAlphabeticName(form.name, "Name"),
    organization: requireText(form.organization, "Organization"),
    email: emailError,
    password: passwordError,
    confirmPassword: confirmError,
  };
}

export function validateLogin(form: LoginForm): ValidationErrors<keyof LoginForm> {
  return {
    email: !/^\S+@\S+\.\S+$/.test(form.email) ? "Email must be valid." : undefined,
    password: form.password.length < 8 ? "Password must be at least 8 characters." : undefined,
  };
}

export function validateCsvField(rawValue: string, label: string) {
  return requireCsv(rawValue, label);
}
