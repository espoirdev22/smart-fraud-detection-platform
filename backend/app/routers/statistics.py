from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.db.models import Transaction

router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("")
def get_statistics(db: Session = Depends(get_db)):
    total = db.query(func.count(Transaction.id)).scalar() or 0
    total_fraud = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.is_fraud_predicted == True)  # noqa: E712
        .scalar() or 0
    )
    fraud_rate = (total_fraud / total * 100) if total > 0 else 0.0

    return {
        "total_transactions": total,
        "total_fraud_detected": total_fraud,
        "fraud_rate_percent": round(fraud_rate, 2),
    }