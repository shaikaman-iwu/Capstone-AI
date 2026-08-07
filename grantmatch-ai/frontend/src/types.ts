export type OrganizationProfile = {
  name: string;
  mission: string;
  location: string;
  annualBudget: number;
  staffCount: number;
  serviceRegions: string[];
  focusAreas: string[];
  populationsServed: string[];
  programs: string;
  recentOutcomes: string;
  fundingNeeds: string;
};

export type GrantMatch = {
  id: string;
  title: string;
  funder: string;
  deadline: string;
  amountMin: number;
  amountMax: number;
  fitScore: number;
  fitLabel: string;
  recommendedUse: string;
  eligibilitySummary: string[];
  rationale: string[];
  applicationFormat: string;
};

export type MatchResponse = {
  organization: OrganizationProfile;
  matches: GrantMatch[];
};

export type DraftResponse = {
  grantId: string;
  grantTitle: string;
  narrative: string;
  talkingPoints: string[];
  nextSteps: string[];
};

export type GrantRecord = {
  id: string;
  title: string;
  funder: string;
  deadline: string;
  amountMin: number;
  amountMax: number;
  focusAreas: string[];
};

export type User = {
  id: number;
  name: string;
  organization: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type LoginForm = {
  email: string;
  password: string;
};

export type RegisterForm = {
  name: string;
  organization: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ServiceStatus = {
  aiProvider: string;
  hasLiveAi: boolean;
  authEnabled: boolean;
};
