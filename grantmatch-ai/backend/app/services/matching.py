from __future__ import annotations

from dataclasses import dataclass

from app.db.database import GrantOpportunity
from app.models.schemas import GrantMatch, OrganizationProfile


@dataclass
class ScoreBreakdown:
    total: int
    rationale: list[str]


def _normalize(values: list[str]) -> set[str]:
    return {value.strip().lower() for value in values if value.strip()}


def score_grant(profile: OrganizationProfile, grant: GrantOpportunity) -> ScoreBreakdown:
    score = 35
    rationale: list[str] = []

    profile_focus = _normalize(profile.focus_areas)
    grant_focus = _normalize(grant.focus_areas)
    focus_overlap = profile_focus & grant_focus
    if focus_overlap:
        score += min(25, 8 * len(focus_overlap))
        rationale.append(f"Focus alignment: {', '.join(sorted(focus_overlap))}.")

    profile_regions = _normalize(profile.service_regions + [profile.location])
    grant_regions = _normalize(grant.geography)
    if "united states" in grant_regions or profile_regions & grant_regions:
        score += 18
        rationale.append("Geography is eligible for the funder's stated service area.")

    if profile.annual_budget <= 750000 and any("under $750,000" in rule.lower() for rule in grant.eligibility_rules):
        score += 10
        rationale.append("Organization budget fits the small-nonprofit funding threshold.")

    program_text = f"{profile.programs} {profile.recent_outcomes} {profile.funding_needs}".lower()
    keyword_hits = [term for term in grant.focus_areas if term.lower().split()[0] in program_text]
    if keyword_hits:
        score += min(12, 4 * len(keyword_hits))
        rationale.append(f"Program description references {', '.join(keyword_hits[:3])} work already underway.")

    if profile.staff_count <= 15:
        rationale.append("Lean staffing profile matches the product's target nonprofit segment.")

    return ScoreBreakdown(total=min(score, 99), rationale=rationale)


def fit_label(score: int) -> str:
    if score >= 85:
        return "Strong fit"
    if score >= 70:
        return "Promising"
    return "Needs review"


def summarize_eligibility(profile: OrganizationProfile, grant: GrantOpportunity) -> list[str]:
    summary = [
        f"{profile.name} appears eligible based on geography, mission fit, and stated program model.",
        f"This opportunity funds {', '.join(grant.focus_areas[:3])} and matches the organization's described priorities.",
    ]

    if any("under $750,000" in rule.lower() for rule in grant.eligibility_rules):
        summary.append("The organization's budget is below the stated small-nonprofit ceiling in the guidelines.")

    summary.extend(grant.eligibility_rules[:2])
    return summary


def build_matches(profile: OrganizationProfile, grants: list[GrantOpportunity]) -> list[GrantMatch]:
    ranked: list[GrantMatch] = []
    for grant in grants:
        breakdown = score_grant(profile, grant)
        ranked.append(
            GrantMatch(
                id=grant.id,
                title=grant.title,
                funder=grant.funder,
                deadline=grant.deadline,
                amountMin=grant.amount_min,
                amountMax=grant.amount_max,
                fitScore=breakdown.total,
                fitLabel=fit_label(breakdown.total),
                recommendedUse=f"Use this grant for {profile.funding_needs.split('.')[0].lower()} while reinforcing measurable outcomes in {', '.join(profile.focus_areas[:2])}.",
                eligibilitySummary=summarize_eligibility(profile, grant),
                rationale=breakdown.rationale,
                applicationFormat=grant.application_format,
            )
        )

    return sorted(ranked, key=lambda item: item.fit_score, reverse=True)
