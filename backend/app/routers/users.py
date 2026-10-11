from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.services.common import iso

router = APIRouter(prefix="/users", tags=["users"])

ROLES = ["Analyste Fraude", "Superviseur", "Administrateur"]


def user_dict(u: User) -> dict:
    return {"id": u.id, "name": u.name, "email": u.email, "role": u.role, "active": u.active,
            "created_at": iso(u.created_at)}


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: Optional[str] = Field(default=None, max_length=120)
    role: str = "Analyste Fraude"


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    email: Optional[str] = None
    role: Optional[str] = None
    active: Optional[bool] = None


def ensure_default_user(db: Session):
    if db.query(User).count() == 0:
        db.add(User(name="Salou Diallo", role="Analyste Fraude"))
        db.commit()


@router.get("")
def list_users(db: Session = Depends(get_db)):
    return [user_dict(u) for u in db.query(User).order_by(User.id).all()]


@router.get("/me")
def current_user(db: Session = Depends(get_db)):
    """Pas d'authentification en v1 : l'utilisateur courant est le premier compte actif."""
    u = db.query(User).filter(User.active == True).order_by(User.id).first()  # noqa: E712
    if not u:
        raise HTTPException(404, "Aucun utilisateur actif")
    return user_dict(u)


@router.post("", status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    if body.role not in ROLES:
        raise HTTPException(400, f"Role inconnu. Valeurs possibles : {', '.join(ROLES)}")
    u = User(name=body.name.strip(), email=(body.email or "").strip() or None, role=body.role)
    db.add(u)
    db.commit()
    db.refresh(u)
    return user_dict(u)


@router.patch("/{user_id}")
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Utilisateur introuvable")
    if body.role is not None and body.role not in ROLES:
        raise HTTPException(400, f"Role inconnu. Valeurs possibles : {', '.join(ROLES)}")
    if body.active is False and u.active and db.query(User).filter(User.active == True).count() <= 1:  # noqa: E712
        raise HTTPException(400, "Impossible de desactiver le dernier compte actif.")
    for field in ("name", "email", "role", "active"):
        value = getattr(body, field)
        if value is not None:
            setattr(u, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    return user_dict(u)
