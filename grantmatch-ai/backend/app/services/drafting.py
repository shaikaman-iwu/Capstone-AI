from __future__ import annotations

from app.db.database import GrantOpportunity
from app.models.schemas import DraftResponse, OrganizationProfile
from app.services.ai_client import AIClient


def _fallback_narrative(profile: OrganizationProfile, grant: GrantOpportunity, provider_name: str) -> DraftResponse:
    narrative = (
        f"{profile.name} seeks support through the {grant.title} to expand work in {', '.join(profile.focus_areas[:2])}. "
        f"Our mission is to {profile.mission.lower().rstrip('.')} The proposed investment would address {profile.funding_needs.lower().rstrip('.')} "
        f"Across {', '.join(profile.service_regions)}, the organization currently delivers {profile.programs.lower().rstrip('.')} "
        f"Recent outcomes demonstrate readiness to scale: {profile.recent_outcomes.lower().rstrip('.')} "
        f"This request aligns with {grant.funder}'s priorities because the grant emphasizes {', '.join(grant.focus_areas[:3]).lower()} and values measurable community impact. "
        f"Draft generated via {provider_name} pathway with grounded local context."
    )

    return DraftResponse(
        grantId=grant.id,
        grantTitle=grant.title,
        narrative=narrative,
        talkingPoints=[
            "Lead with the mission and direct-service model in the first paragraph.",
            "Quantify outcomes and community reach early to satisfy eligibility screening.",
            "Tie requested funds to concrete expansion needs rather than general operations alone.",
        ],
        nextSteps=[
            "Verify the latest deadline and attachments against the full guidelines.",
            "Add a grant-specific budget narrative tied to the proposed activities.",
            "Pull one client or community story to strengthen the final submission.",
        ],
    )


def generate_narrative(profile: OrganizationProfile, grant: GrantOpportunity, ai_client: AIClient) -> DraftResponse:
    provider_name = ai_client.provider_label()

    if ai_client.openai_enabled:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=__import__("app.core.config", fromlist=["settings"]).settings.openai_api_key)
            prompt = (
                "Write a concise first-draft grant narrative grounded only in this nonprofit profile and grant summary. "
                f"Organization: {profile.model_dump()} Grant: {{'title': '{grant.title}', 'funder': '{grant.funder}', 'summary': '{grant.summary}'}}"
            )
            response = client.responses.create(
                model="gpt-4.1-mini",
                input=prompt,
            )
            output_text = getattr(response, "output_text", None)
            if output_text:
                return DraftResponse(
                    grantId=grant.id,
                    grantTitle=grant.title,
                    narrative=output_text,
                    talkingPoints=[
                        "Validate factual claims against the organization profile before submission.",
                        "Add specific budget and staffing details in the final edit.",
                        "Pair the narrative with measurable outcomes and a deadline plan.",
                    ],
                    nextSteps=[
                        "Review against the full grant guidance.",
                        "Insert exact budget numbers and program timeline.",
                        "Route to leadership for final sign-off.",
                    ],
                )
        except Exception:
            pass

    if ai_client.anthropic_enabled:
        try:
            from anthropic import Anthropic

            anthropic = Anthropic(api_key=__import__("app.core.config", fromlist=["settings"]).settings.anthropic_api_key)
            message = anthropic.messages.create(
                model="claude-3-5-sonnet-latest",
                max_tokens=700,
                messages=[
                    {
                        "role": "user",
                        "content": (
                            "Draft a grounded grant narrative using only the nonprofit profile and grant summary. "
                            f"Profile: {profile.model_dump()} Grant: {{'title': '{grant.title}', 'funder': '{grant.funder}', 'summary': '{grant.summary}'}}"
                        ),
                    }
                ],
            )
            text_blocks = [block.text for block in message.content if hasattr(block, "text")]
            if text_blocks:
                return DraftResponse(
                    grantId=grant.id,
                    grantTitle=grant.title,
                    narrative="\n\n".join(text_blocks),
                    talkingPoints=[
                        "Check the opening for direct alignment to the funder's stated priorities.",
                        "Add quantitative outcomes from recent programs.",
                        "Include a concise implementation timeline.",
                    ],
                    nextSteps=[
                        "Attach budget and required organizational documents.",
                        "Review with the executive director.",
                        "Submit ahead of the deadline buffer window.",
                    ],
                )
        except Exception:
            pass

    return _fallback_narrative(profile, grant, provider_name)
