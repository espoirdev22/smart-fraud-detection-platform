"""Mots de passe et jetons de connexion.

Mot de passe : jamais stocke en clair, seulement une empreinte scrypt (fonction de
la bibliotheque standard, volontairement lente pour decourager les attaques).
Jeton : un JWT signe, valable quelques heures. Le serveur ne garde rien en memoire,
il verifie juste la signature.
"""
import base64
import hashlib
import hmac
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings

log = logging.getLogger(__name__)

ALGORITHM = "HS256"
_N, _R, _P = 2 ** 14, 8, 1

if settings.secret_key:
    SECRET_KEY = settings.secret_key
else:
    SECRET_KEY = secrets.token_urlsafe(48)
    log.warning("SECRET_KEY absente : cle aleatoire generee, les sessions sauteront au redemarrage.")


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=_N, r=_R, p=_P)
    return "scrypt$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(digest).decode()


def verify_password(password: str, stored: str | None) -> bool:
    if not stored or not stored.startswith("scrypt$"):
        return False
    try:
        _, salt_b64, digest_b64 = stored.split("$")
        salt, expected = base64.b64decode(salt_b64), base64.b64decode(digest_b64)
        digest = hashlib.scrypt(password.encode(), salt=salt, n=_N, r=_R, p=_P)
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(digest, expected)


def create_token(user_id: int, role: str) -> tuple[str, int]:
    """Retourne (jeton, duree de validite en secondes)."""
    expires = timedelta(minutes=settings.token_minutes)
    payload = {"sub": str(user_id), "role": role, "exp": datetime.now(timezone.utc) + expires}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM), int(expires.total_seconds())


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
