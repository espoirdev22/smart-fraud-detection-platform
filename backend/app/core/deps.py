"""Les 'gardiens' de l'API : a mettre sur une route pour exiger un badge valide."""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.database import get_db
from app.db.models import User

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(401, "Connexion requise", headers={"WWW-Authenticate": "Bearer"})
    if creds is None:
        raise unauthorized
    payload = decode_token(creds.credentials)
    if not payload:
        raise HTTPException(401, "Session expiree, reconnecte-toi", headers={"WWW-Authenticate": "Bearer"})
    user = db.get(User, int(payload["sub"]))
    if not user or not user.active:
        raise unauthorized
    return user


def require_roles(*roles: str, message: str):
    """Fabrique un gardien : n'ouvre la porte qu'aux roles listes."""
    def guard(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(403, message)
        return user
    return guard


# Analyste Fraude : traite les alertes. Superviseur : + rapports, seuils, liste des comptes.
# Administrateur : + creation et modification des comptes.
require_supervisor = require_roles(
    "Superviseur", "Administrateur", message="Action reservee aux superviseurs et aux administrateurs")
require_admin = require_roles("Administrateur", message="Action reservee aux administrateurs")
