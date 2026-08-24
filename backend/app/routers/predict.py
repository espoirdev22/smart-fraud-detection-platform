from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import TransactionInput, PredictionOutput
from app.services.ml_service import predict as predict_fraud
from app.core.config import settings
from app.db.database import get_db
from app.db.models import Transaction

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("", response_model=PredictionOutput)
def predict_transaction(payload: TransactionInput, db: Session = Depends(get_db)):
    probability = predict_fraud(payload)
    is_fraud = probability >= settings.fraud_threshold

    record = Transaction(
        type=payload.type,
        amount=payload.amount,
        old_balance_orig=payload.oldbalanceOrg,
        new_balance_orig=payload.newbalanceOrig,
        old_balance_dest=payload.oldbalanceDest,
        new_balance_dest=payload.newbalanceDest,
        fraud_probability=probability,
        is_fraud_predicted=is_fraud,
    )
    db.add(record)
    db.commit()

    return PredictionOutput(
        fraud_probability=probability,
        is_fraud=is_fraud,
        threshold_used=settings.fraud_threshold,
    )