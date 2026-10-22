from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_token, hash_password, verify_password
from app.db.database import get_db
from app.db.models import User
from app.routers.users import user_dict

router = APIRouter(prefix="/auth", tags=["auth"])

# Empreinte factice : on la verifie quand l'email est inconnu, pour que la reponse
# prenne le meme temps et ne revele pas quels emails existent.
_DUMMY_HASH = hash_password("dummy-password")


class LoginBody(BaseModel):
    email: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=1, max_length=128)


class PasswordBody(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    ok = verify_password(body.password, user.password_hash if user else _DUMMY_HASH)
    if not user or not ok or not user.active:
        raise HTTPException(401, "Email ou mot de passe incorrect")
    token, expires_in = create_token(user.id, user.role)
    return {"access_token": token, "token_type": "bearer", "expires_in": expires_in, "user": user_dict(user)}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_dict(user)


@router.post("/change-password")
def change_password(body: PasswordBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(400, "Mot de passe actuel incorrect")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"ok": True}
