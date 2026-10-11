import time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from prometheus_client import Counter, Histogram

from app.models.schemas import TransactionInput, PredictionOutput
from app.services.ml_service import predict as predict_fraud, display_score, explain
from app.services.settings_service import get_thresholds
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
DETECTION = Histogram(
    "fraud_detection_seconds",
    "Temps d'analyse d'une transaction (modele + explication)",
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
)


def decide_action(raw: float, thresholds: dict) -> str:
    if raw >= thresholds["block"]:
        return "BLOCK"
    if raw >= thresholds["verify"]:
        return "VERIFY"
    return "PASS"


@router.post("", response_model=PredictionOutput)
def predict_transaction(payload: TransactionInput, db: Session = Depends(get_db)):
    started = time.perf_counter()
    thresholds = get_thresholds(db)

    raw = predict_fraud(payload)
    shown = display_score(raw, settings.score_temperature)
    action = decide_action(raw, thresholds)
    is_fraud = raw >= thresholds["verify"]
    score = round(shown * 1000)

    try:
        factors = explain(payload, top_n=4)
    except Exception:
        factors = []

    detection_ms = round((time.perf_counter() - started) * 1000, 1)

    PREDICTIONS.labels(action=action).inc()
    SCORES.observe(score)
    DETECTION.observe(detection_ms / 1000)

    record = Transaction(
        type=payload.type,
        amount=payload.amount,
        old_balance_orig=payload.oldbalanceOrg,
        new_balance_orig=payload.newbalanceOrig,
        old_balance_dest=payload.oldbalanceDest,
        new_balance_dest=payload.newbalanceDest,
        fraud_probability=shown,
        is_fraud_predicted=is_fraud,
        phone=payload.phone,
        location=payload.location,
        score=score,
        action=action,
        factors=factors,
        detection_ms=detection_ms,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return PredictionOutput(
        id=record.id,
        fraud_probability=shown,
        score=score,
        action=action,
        is_fraud=is_fraud,
        threshold_used=thresholds["verify"],
        detection_ms=detection_ms,
        factors=factors[:3],
    )
