from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Transaction
from app.services.common import tx_dict

router = APIRouter(prefix="/alerts", tags=["alerts"])


def _open_count(db: Session) -> int:
    return db.query(Transaction).filter(
        Transaction.is_fraud_predicted == True, Transaction.handled == False  # noqa: E712
    ).count()


@router.get("/count")
def alerts_count(db: Session = Depends(get_db)):
    return {"open": _open_count(db)}


@router.get("")
def list_alerts(
    status: str = Query("open", pattern="^(open|handled|all)$"),
    action: Optional[str] = Query(None, pattern="^(VERIFY|BLOCK)$"),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    q = db.query(Transaction).filter(Transaction.is_fraud_predicted == True)  # noqa: E712
    if status == "open":
        q = q.filter(Transaction.handled == False)  # noqa: E712
    elif status == "handled":
        q = q.filter(Transaction.handled == True)  # noqa: E712
    if action:
        q = q.filter(Transaction.action == action)
    total = q.count()
    rows = q.order_by(Transaction.created_at.desc(), Transaction.id.desc()).offset(offset).limit(limit).all()
    return {"items": [tx_dict(t) for t in rows], "total": total, "open_count": _open_count(db)}
