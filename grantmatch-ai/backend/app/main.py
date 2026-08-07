from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import NarrativeDraft, OrganizationSnapshot, SavedGrant, get_session, init_db
from app.models.schemas import (
    AuthResponse,
    DraftRequest,
    DraftResponse,
    GrantRecord,
    MatchResponse,
    OrganizationProfile,
    ServiceStatus,
    UserLoginRequest,
    UserRegistrationRequest,
    UserResponse,
)
from app.services.ai_client import AIClient
from app.services.auth import authenticate_user, current_user_from_header, register_user, seed_demo_user, serialize_user
from app.services.drafting import generate_narrative
from app.services.grant_repository import get_grant_by_id, list_grants, seed_grants
from app.services.matching import build_matches


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    with next(get_session()) as session:
        seed_grants(session)
        seed_demo_user(session)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="GrantMatch AI backend for nonprofit grant retrieval, matching, and first-draft generation.",
    lifespan=lifespan,
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    messages = [f"{'/'.join(str(item) for item in error['loc'][1:])}: {error['msg']}" for error in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": "; ".join(messages)})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": str(exc) if settings.auth_required is False else "Internal server error."})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:4173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/status", response_model=ServiceStatus)
def service_status() -> ServiceStatus:
    ai_client = AIClient()
    return ServiceStatus(aiProvider=ai_client.provider_label(), hasLiveAi=ai_client.has_live_provider(), authEnabled=settings.auth_required)


@app.post("/api/auth/register", response_model=AuthResponse)
def auth_register(payload: UserRegistrationRequest, session: Session = Depends(get_session)) -> AuthResponse:
    return register_user(session, payload)


@app.post("/api/auth/login", response_model=AuthResponse)
def auth_login(payload: UserLoginRequest, session: Session = Depends(get_session)) -> AuthResponse:
    return authenticate_user(session, payload)


@app.get("/api/auth/me", response_model=UserResponse)
def auth_me(session: Session = Depends(get_session), user=Depends(current_user_from_header)) -> UserResponse:
    return serialize_user(user)


@app.get("/api/grants", response_model=list[GrantRecord])
def get_grants(session: Session = Depends(get_session), _: UserResponse = Depends(current_user_from_header)) -> list[GrantRecord]:
    grants = list_grants(session)
    return [
        GrantRecord(
            id=grant.id,
            title=grant.title,
            funder=grant.funder,
            deadline=grant.deadline,
            amountMin=grant.amount_min,
            amountMax=grant.amount_max,
            focusAreas=grant.focus_areas,
            eligibilityRules=grant.eligibility_rules,
            applicationFormat=grant.application_format,
            geography=grant.geography,
            summary=grant.summary,
        )
        for grant in grants
    ]


@app.post("/api/matches/rank", response_model=MatchResponse)
def rank_grants(
    profile: OrganizationProfile,
    session: Session = Depends(get_session),
    user=Depends(current_user_from_header),
) -> MatchResponse:
    grants = list_grants(session)
    matches = build_matches(profile, grants)
    session.add(
        OrganizationSnapshot(
            name=profile.name,
            mission=profile.mission,
            location=profile.location,
            annual_budget=profile.annual_budget,
            staff_count=profile.staff_count,
            service_regions=profile.service_regions,
            focus_areas=profile.focus_areas,
            populations_served=profile.populations_served,
            programs=profile.programs,
            recent_outcomes=profile.recent_outcomes,
            funding_needs=profile.funding_needs,
        )
    )
    if matches:
        top = matches[0]
        session.add(
            SavedGrant(
                user_id=user.id,
                grant_id=top.id,
                grant_title=top.title,
                fit_score=top.fit_score,
                rationale=top.rationale,
            )
        )
    session.commit()
    return MatchResponse(organization=profile, matches=matches)


@app.post("/api/drafts/narrative", response_model=DraftResponse)
def draft_narrative(
    request: DraftRequest,
    session: Session = Depends(get_session),
    user=Depends(current_user_from_header),
) -> DraftResponse:
    grant = get_grant_by_id(session, request.grant_id)
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found.")

    draft = generate_narrative(request.profile, grant, AIClient())
    session.add(
        NarrativeDraft(
            grant_id=grant.id,
            organization_name=user.organization,
            narrative=draft.narrative,
        )
    )
    session.commit()
    return draft
