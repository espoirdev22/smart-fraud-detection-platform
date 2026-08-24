from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import Transaction

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("")
def list_transactions(limit: int = 50, db: Session = Depends(get_db)):
    records = (
        db.query(Transaction)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return records