import type { AuthResponse, DraftResponse, GrantRecord, LoginForm, MatchResponse, OrganizationProfile, RegisterForm, ServiceStatus, User } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Request failed.");
  }

  return response.json() as Promise<T>;
}

export function fetchGrantCatalog() {
  throw new Error("Authentication token required.");
}

export function fetchGrantCatalogAuthenticated(token: string) {
  return request<GrantRecord[]>("/api/grants", undefined, token);
}

export function fetchServiceStatus() {
  return request<ServiceStatus>("/api/status");
}

export function login(payload: LoginForm) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterForm) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      organization: payload.organization,
      email: payload.email,
      password: payload.password,
    }),
  });
}

export function fetchCurrentUser(token: string) {
  return request<User>("/api/auth/me", undefined, token);
}

export function rankMatches(profile: OrganizationProfile, token: string) {
  return request<MatchResponse>(
    "/api/matches/rank",
    {
      method: "POST",
      body: JSON.stringify(profile),
    },
    token,
  );
}

export function generateNarrative(profile: OrganizationProfile, grantId: string, token: string) {
  return request<DraftResponse>(
    "/api/drafts/narrative",
    {
      method: "POST",
      body: JSON.stringify({ profile, grant_id: grantId }),
    },
    token,
  );
}
