from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import GrantOpportunity
from app.db.sample_data import GRANT_OPPORTUNITIES


def seed_grants(session: Session) -> None:
    existing = session.scalar(select(GrantOpportunity.id).limit(1))
    if existing:
        return

    session.add_all(GrantOpportunity(**grant) for grant in GRANT_OPPORTUNITIES)
    session.commit()


def list_grants(session: Session) -> list[GrantOpportunity]:
    return list(session.scalars(select(GrantOpportunity).order_by(GrantOpportunity.deadline.asc())))


def get_grant_by_id(session: Session, grant_id: str) -> GrantOpportunity | None:
    return session.get(GrantOpportunity, grant_id)
