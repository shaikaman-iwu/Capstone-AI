from __future__ import annotations

import hashlib
import hmac
import secrets

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import AuthSession, UserAccount, get_session
from app.models.schemas import AuthResponse, UserLoginRequest, UserRegistrationRequest, UserResponse


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    salt, stored_hash = password_hash.split("$", maxsplit=1)
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000).hex()
    return hmac.compare_digest(candidate, stored_hash)


def serialize_user(user: UserAccount) -> UserResponse:
    return UserResponse(id=user.id, name=user.name, organization=user.organization, email=user.email)


def issue_token(session: Session, user: UserAccount) -> AuthResponse:
    token = secrets.token_urlsafe(32)
    session.add(AuthSession(user_id=user.id, token=token))
    session.commit()
    return AuthResponse(token=token, user=serialize_user(user))


def register_user(session: Session, payload: UserRegistrationRequest) -> AuthResponse:
    existing = session.scalar(select(UserAccount).where(UserAccount.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="An account already exists for that email.")

    user = UserAccount(
        name=payload.name,
        organization=payload.organization,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return issue_token(session, user)


def authenticate_user(session: Session, payload: UserLoginRequest) -> AuthResponse:
    user = session.scalar(select(UserAccount).where(UserAccount.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return issue_token(session, user)


def current_user_from_header(
    session: Session = Depends(get_session),
    authorization: str | None = Header(default=None),
) -> UserAccount:
    if not settings.auth_required:
        demo_user = session.scalar(select(UserAccount).limit(1))
        if demo_user:
            return demo_user
        raise HTTPException(status_code=401, detail="No demo user available.")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token.")

    token = authorization.replace("Bearer ", "", 1).strip()
    auth_session = session.scalar(select(AuthSession).where(AuthSession.token == token))
    if not auth_session:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")

    user = session.get(UserAccount, auth_session.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User account no longer exists.")
    return user


def seed_demo_user(session: Session) -> None:
    existing = session.scalar(select(UserAccount).where(UserAccount.email == "director@grantmatch.demo"))
    if existing:
        return

    session.add(
        UserAccount(
            name="Maya Thompson",
            organization="Southside Youth Table",
            email="director@grantmatch.demo",
            password_hash=hash_password(settings.demo_user_password),
        )
    )
    session.commit()
