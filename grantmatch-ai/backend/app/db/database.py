from collections.abc import Generator

from sqlalchemy import JSON, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from app.core.config import settings


connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


class GrantOpportunity(Base):
    __tablename__ = "grant_opportunities"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    funder: Mapped[str] = mapped_column(String(255), nullable=False)
    deadline: Mapped[str] = mapped_column(String(32), nullable=False)
    amount_min: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_max: Mapped[int] = mapped_column(Integer, nullable=False)
    focus_areas: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    eligibility_rules: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    application_format: Mapped[str] = mapped_column(String(120), nullable=False)
    geography: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)


class OrganizationSnapshot(Base):
    __tablename__ = "organization_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    mission: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    annual_budget: Mapped[int] = mapped_column(Integer, nullable=False)
    staff_count: Mapped[int] = mapped_column(Integer, nullable=False)
    service_regions: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    focus_areas: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    populations_served: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    programs: Mapped[str] = mapped_column(Text, nullable=False)
    recent_outcomes: Mapped[str] = mapped_column(Text, nullable=False)
    funding_needs: Mapped[str] = mapped_column(Text, nullable=False)


class NarrativeDraft(Base):
    __tablename__ = "narrative_drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    grant_id: Mapped[str] = mapped_column(String(64), nullable=False)
    organization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    narrative: Mapped[str] = mapped_column(Text, nullable=False)


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    organization: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)


class SavedGrant(Base):
    __tablename__ = "saved_grants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    grant_id: Mapped[str] = mapped_column(String(64), nullable=False)
    grant_title: Mapped[str] = mapped_column(String(255), nullable=False)
    fit_score: Mapped[int] = mapped_column(Integer, nullable=False)
    rationale: Mapped[list[str]] = mapped_column(JSON, nullable=False)


def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
