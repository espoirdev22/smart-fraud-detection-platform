"""Seuils de decision modifiables depuis la page Parametres (stockes en base)."""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import AppSetting


def get_thresholds(db: Session) -> dict:
    rows = {r.key: r.value for r in db.query(AppSetting).all()}
    return {
        "verify": float(rows.get("verify_threshold", settings.verify_threshold)),
        "block": float(rows.get("block_threshold", settings.block_threshold)),
    }


def set_thresholds(db: Session, verify: float, block: float) -> dict:
    for key, value in (("verify_threshold", verify), ("block_threshold", block)):
        row = db.get(AppSetting, key)
        if row:
            row.value = str(value)
        else:
            db.add(AppSetting(key=key, value=str(value)))
    db.commit()
    return get_thresholds(db)
