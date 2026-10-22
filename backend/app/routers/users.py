from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user, require_admin, require_supervisor
from app.core.security import hash_password
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
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    email: Optional[str] = None
    role: Optional[str] = None
    active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)


def ensure_default_user(db: Session):
    """Garantit qu'un compte administrateur existe, sinon personne ne pourrait se connecter.

    - base vide : on cree le compte de depart (ADMIN_EMAIL / ADMIN_PASSWORD)
    - ancienne base sans mots de passe : le premier compte devient ce compte de depart
    """
    first = db.query(User).order_by(User.id).first()
    if first is None:
        first = User(name="Salou Diallo")
        db.add(first)
    if not first.password_hash:
        first.email = first.email or settings.admin_email
        first.role = "Administrateur"
        first.password_hash = hash_password(settings.admin_password)
    db.commit()


@router.get("", dependencies=[Depends(require_supervisor)])
def list_users(db: Session = Depends(get_db)):
    return [user_dict(u) for u in db.query(User).order_by(User.id).all()]


@router.get("/me")
def current_user(user: User = Depends(get_current_user)):
    return user_dict(user)


@router.post("", status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    if body.role not in ROLES:
        raise HTTPException(400, f"Role inconnu. Valeurs possibles : {', '.join(ROLES)}")
    email = (body.email or "").strip().lower() or None
    if email and db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "Cet email est deja utilise")
    u = User(name=body.name.strip(), email=email, role=body.role, password_hash=hash_password(body.password))
    db.add(u)
    db.commit()
    db.refresh(u)
    return user_dict(u)


@router.patch("/{user_id}")
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Utilisateur introuvable")
    if body.role is not None and body.role not in ROLES:
        raise HTTPException(400, f"Role inconnu. Valeurs possibles : {', '.join(ROLES)}")
    if u.id == admin.id and (body.active is False or (body.role and body.role != "Administrateur")):
        raise HTTPException(400, "Tu ne peux pas te retirer toi-meme l'acces administrateur.")
    if body.active is False and u.active and db.query(User).filter(User.active == True).count() <= 1:  # noqa: E712
        raise HTTPException(400, "Impossible de desactiver le dernier compte actif.")
    if body.password:
        u.password_hash = hash_password(body.password)
    for field in ("name", "email", "role", "active"):
        value = getattr(body, field)
        if value is not None:
            setattr(u, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    return user_dict(u)
