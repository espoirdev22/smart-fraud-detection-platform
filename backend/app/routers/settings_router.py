import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import require_supervisor
from app.db.database import get_db
from app.db.models import Transaction
from app.services.common import iso
from app.services.settings_service import get_thresholds, set_thresholds

router = APIRouter(tags=["settings"])


class ThresholdsBody(BaseModel):
    verify: float
    block: float


@router.get("/settings", dependencies=[Depends(require_supervisor)])
def read_settings(db: Session = Depends(get_db)):
    return {
        "thresholds": get_thresholds(db),
        "defaults": {"verify": settings.verify_threshold, "block": settings.block_threshold},
        "score_temperature": settings.score_temperature,
    }


@router.put("/settings/thresholds")
def update_thresholds(body: ThresholdsBody, db: Session = Depends(get_db), _user=Depends(require_supervisor)):
    if not (0 < body.verify < body.block < 1):
        raise HTTPException(400, "Les seuils doivent verifier 0 < verification < blocage < 1.")
    return {"thresholds": set_thresholds(db, round(body.verify, 4), round(body.block, 4))}


@router.get("/system/status")
def system_status(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    last = db.query(Transaction.created_at).order_by(Transaction.created_at.desc()).first() if db_ok else None
    model_ok = os.path.exists(settings.model_path)
    return {
        "operational": db_ok and model_ok,
        "database": db_ok,
        "model": model_ok,
        "last_transaction_at": iso(last[0]) if last else None,
        "api_version": "1.0.0",
    }
