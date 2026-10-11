from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from prometheus_client import Counter, Histogram

from app.models.schemas import TransactionInput, PredictionOutput
from app.services.ml_service import predict as predict_fraud, display_score, explain
from app.core.config import settings
from app.db.database import get_db
from app.db.models import Transaction

router = APIRouter(prefix="/predict", tags=["predict"])

PREDICTIONS = Counter(
    "fraud_predictions_total",
    "Nombre de predictions par decision",
    ["action"],
)
SCORES = Histogram(
    "fraud_score",
    "Repartition des scores de risque (0 a 1000)",
    buckets=[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
)


def decide_action(raw: float) -> str:
    if raw >= settings.block_threshold:
        return "BLOCK"
    if raw >= settings.verify_threshold:
        return "VERIFY"
    return "PASS"


@router.post("", response_model=PredictionOutput)
def predict_transaction(payload: TransactionInput, db: Session = Depends(get_db)):
    raw = predict_fraud(payload)
    shown = display_score(raw, settings.score_temperature)
    action = decide_action(raw)
    is_fraud = raw >= settings.verify_threshold
    score = round(shown * 1000)

    PREDICTIONS.labels(action=action).inc()
    SCORES.observe(score)

    record = Transaction(
        type=payload.type,
        amount=payload.amount,
        old_balance_orig=payload.oldbalanceOrg,
        new_balance_orig=payload.newbalanceOrig,
        old_balance_dest=payload.oldbalanceDest,
        new_balance_dest=payload.newbalanceDest,
        fraud_probability=shown,
        is_fraud_predicted=is_fraud,
    )
    db.add(record)
    db.commit()

    try:
        factors = explain(payload)
    except Exception:
        factors = []

    return PredictionOutput(
        fraud_probability=shown,
        score=score,
        action=action,
        is_fraud=is_fraud,
        threshold_used=settings.verify_threshold,
        factors=factors,
    )