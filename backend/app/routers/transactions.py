from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_, cast, String
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Transaction
from app.services.common import tx_dict, iso, resolve_period, in_period
from app.services.settings_service import get_thresholds

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("")
def list_transactions(limit: int = Query(50, ge=1, le=500), db: Session = Depends(get_db)):
    records = db.query(Transaction).order_by(Transaction.created_at.desc(), Transaction.id.desc()).limit(limit).all()
    return [tx_dict(t) for t in records]


@router.get("/search")
def search_transactions(
    q: Optional[str] = None,
    action: Optional[str] = Query(None, pattern="^(PASS|VERIFY|BLOCK)$"),
    type: Optional[str] = None,
    handled: Optional[bool] = None,
    start: Optional[date] = None,
    end: Optional[date] = None,
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction)
    if start or end:
        start_dt, end_dt, _ = resolve_period(start, end)
        query = in_period(query, start_dt, end_dt)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(
            Transaction.phone.ilike(like),
            Transaction.location.ilike(like),
            Transaction.type.ilike(like),
            cast(Transaction.id, String) == q.strip().lstrip("#"),
        ))
    if action:
        query = query.filter(Transaction.action == action)
    if type:
        query = query.filter(Transaction.type == type)
    if handled is not None:
        query = query.filter(Transaction.handled == handled)
    total = query.count()
    rows = query.order_by(Transaction.created_at.desc(), Transaction.id.desc()).offset(offset).limit(limit).all()
    return {"items": [tx_dict(t) for t in rows], "total": total}


@router.get("/{tx_id}")
def transaction_detail(tx_id: int, db: Session = Depends(get_db)):
    t = db.get(Transaction, tx_id)
    if not t:
        raise HTTPException(404, "Transaction introuvable")
    data = tx_dict(t)
    history = {"total": 0, "flagged": 0}
    if t.phone:
        base = db.query(Transaction).filter(Transaction.phone == t.phone, Transaction.id != t.id)
        history = {
            "total": base.count(),
            "flagged": base.filter(Transaction.is_fraud_predicted == True).count(),  # noqa: E712
        }
    data.update({
        "factors": t.factors or [],
        "old_balance_orig": t.old_balance_orig,
        "new_balance_orig": t.new_balance_orig,
        "old_balance_dest": t.old_balance_dest,
        "new_balance_dest": t.new_balance_dest,
        "handled_at": iso(t.handled_at),
        "phone_history": history,
        "thresholds": get_thresholds(db),
    })
    return data


class HandleBody(BaseModel):
    handled: bool = True


@router.patch("/{tx_id}/handle")
def handle_transaction(tx_id: int, body: HandleBody = HandleBody(), db: Session = Depends(get_db)):
    t = db.get(Transaction, tx_id)
    if not t:
        raise HTTPException(404, "Transaction introuvable")
    t.handled = body.handled
    t.handled_at = datetime.now(timezone.utc) if body.handled else None
    db.commit()
    return tx_dict(t)
