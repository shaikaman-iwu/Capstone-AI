from pydantic import BaseModel, EmailStr, Field, field_validator


def _non_empty_text(value: str, field_name: str) -> str:
    cleaned = value.strip()
    if len(cleaned) < 3:
        raise ValueError(f"{field_name} must be at least 3 characters.")
    return cleaned


def _non_empty_items(values: list[str], field_name: str) -> list[str]:
    cleaned = [item.strip() for item in values if item.strip()]
    if not cleaned:
        raise ValueError(f"{field_name} must include at least one value.")
    return cleaned


def _alphabetic_name(value: str, field_name: str) -> str:
    cleaned = _non_empty_text(value, field_name)
    if not cleaned.replace(" ", "").isalpha():
        raise ValueError(f"{field_name} must contain letters only.")
    return cleaned


class OrganizationProfile(BaseModel):
    name: str
    mission: str
    location: str
    annual_budget: int = Field(alias="annualBudget")
    staff_count: int = Field(alias="staffCount")
    service_regions: list[str] = Field(alias="serviceRegions")
    focus_areas: list[str] = Field(alias="focusAreas")
    populations_served: list[str] = Field(alias="populationsServed")
    programs: str
    recent_outcomes: str = Field(alias="recentOutcomes")
    funding_needs: str = Field(alias="fundingNeeds")

    model_config = {
        "populate_by_name": True,
    }

    @field_validator("name", "mission", "location", "programs", "recent_outcomes", "funding_needs")
    @classmethod
    def validate_text_fields(cls, value: str, info):
        return _non_empty_text(value, info.field_name.replace("_", " ").title())

    @field_validator("annual_budget")
    @classmethod
    def validate_budget(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Annual budget must be greater than 0.")
        return value

    @field_validator("staff_count")
    @classmethod
    def validate_staff_count(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Staff count must be greater than 0.")
        return value

    @field_validator("service_regions", "focus_areas", "populations_served")
    @classmethod
    def validate_string_lists(cls, value: list[str], info):
        return _non_empty_items(value, info.field_name.replace("_", " ").title())


class GrantRecord(BaseModel):
    id: str
    title: str
    funder: str
    deadline: str
    amount_min: int = Field(alias="amountMin")
    amount_max: int = Field(alias="amountMax")
    focus_areas: list[str] = Field(alias="focusAreas")
    eligibility_rules: list[str] = Field(alias="eligibilityRules")
    application_format: str = Field(alias="applicationFormat")
    geography: list[str]
    summary: str

    model_config = {
        "populate_by_name": True,
    }


class GrantMatch(BaseModel):
    id: str
    title: str
    funder: str
    deadline: str
    amount_min: int = Field(alias="amountMin")
    amount_max: int = Field(alias="amountMax")
    fit_score: int = Field(alias="fitScore")
    fit_label: str = Field(alias="fitLabel")
    recommended_use: str = Field(alias="recommendedUse")
    eligibility_summary: list[str] = Field(alias="eligibilitySummary")
    rationale: list[str]
    application_format: str = Field(alias="applicationFormat")

    model_config = {
        "populate_by_name": True,
    }


class MatchResponse(BaseModel):
    organization: OrganizationProfile
    matches: list[GrantMatch]


class DraftRequest(BaseModel):
    profile: OrganizationProfile
    grant_id: str = Field(alias="grant_id")

    model_config = {
        "populate_by_name": True,
    }


class DraftResponse(BaseModel):
    grant_id: str = Field(alias="grantId")
    grant_title: str = Field(alias="grantTitle")
    narrative: str
    talking_points: list[str] = Field(alias="talkingPoints")
    next_steps: list[str] = Field(alias="nextSteps")

    model_config = {
        "populate_by_name": True,
    }


class UserRegistrationRequest(BaseModel):
    name: str
    organization: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name", "organization")
    @classmethod
    def validate_name_fields(cls, value: str, info):
        if info.field_name == "name":
            return _alphabetic_name(value, info.field_name.title())
        return _non_empty_text(value, info.field_name.title())


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    name: str
    organization: str
    email: EmailStr


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class ServiceStatus(BaseModel):
    ai_provider: str = Field(alias="aiProvider")
    has_live_ai: bool = Field(alias="hasLiveAi")
    auth_enabled: bool = Field(alias="authEnabled")

    model_config = {
        "populate_by_name": True,
    }
