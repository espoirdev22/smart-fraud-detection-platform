from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from datetime import timedelta

from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Transaction
from app.services.common import resolve_period, in_period, period_totals, pct_change, tx_dict

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Tranches de score affichees (score = fraud_probability affichee, entre 0 et 1)
BUCKETS = [
    ("Très élevé", "≥ 0.8", 0.8, 1.01, "#E5383B"),
    ("Élevé", "0.6 – 0.8", 0.6, 0.8, "#F77F00"),
    ("Moyen", "0.4 – 0.6", 0.4, 0.6, "#FCBF49"),
    ("Faible", "0.2 – 0.4", 0.2, 0.4, "#4EA8DE"),
    ("Très faible", "< 0.2", -0.01, 0.2, "#2BB673"),
]


def risk_distribution(db: Session, start_dt, end_dt) -> list[dict]:
    q = in_period(db.query(Transaction.fraud_probability), start_dt, end_dt)
    scores = [r[0] for r in q.all()]
    total = len(scores)
    out = []
    for label, rng, lo, hi, color in BUCKETS:
        count = sum(1 for s in scores if lo <= s < hi)
        out.append({"label": label, "range": rng, "count": count, "color": color,
                    "percent": round(count / total * 100, 1) if total else 0.0})
    return out


def type_distribution(db: Session, start_dt, end_dt) -> list[dict]:
    rows = (
        in_period(db.query(Transaction.type, func.count(Transaction.id)), start_dt, end_dt)
        .filter(Transaction.is_fraud_predicted == True)  # noqa: E712
        .group_by(Transaction.type).all()
    )
    total = sum(r[1] for r in rows)
    rows = sorted(rows, key=lambda r: r[1], reverse=True)
    return [{"type": t, "count": c, "percent": round(c / total * 100, 1) if total else 0.0} for t, c in rows]


def daily_series(db: Session, start_dt, end_dt) -> list[dict]:
    rows = (
        in_period(db.query(func.date(Transaction.created_at), func.count(Transaction.id),
                           func.sum(case((Transaction.is_fraud_predicted == True, 1), else_=0))), start_dt, end_dt)
        .group_by(func.date(Transaction.created_at)).all()
    )
    by_day = {str(r[0]): (r[1], int(r[2] or 0)) for r in rows}
    out, d = [], start_dt.date()
    while d < end_dt.date():
        total, fraud = by_day.get(d.isoformat(), (0, 0))
        out.append({"date": d.isoformat(), "total": total, "fraud": fraud})
        d += timedelta(days=1)
    return out


@router.get("/summary")
def dashboard_summary(start: Optional[date] = None, end: Optional[date] = None, db: Session = Depends(get_db)):
    start_dt, end_dt, prev_start = resolve_period(start, end)
    cur = period_totals(db, start_dt, end_dt)
    prev = period_totals(db, prev_start, start_dt)
    has_prev = prev["total"] > 0

    rate_delta = round(cur["fraud_rate"] - prev["fraud_rate"], 2) if has_prev else None

    risk = risk_distribution(db, start_dt, end_dt)
    return {
        "period": {"start": start_dt.date().isoformat(), "end": (end_dt.date() - timedelta(days=1)).isoformat(), "has_previous": has_prev},
        "kpis": {
            "total": {"value": cur["total"], "delta": pct_change(cur["total"], prev["total"])},
            "suspicious": {"value": cur["suspicious"], "delta": pct_change(cur["suspicious"], prev["suspicious"])},
            "fraud_rate": {"value": round(cur["fraud_rate"], 2), "delta": rate_delta},
            "false_positives": {"value": cur["false_positives"],
                                "delta": pct_change(cur["false_positives"], prev["false_positives"])},
            "avg_detection_s": {
                "value": round(cur["avg_detection_ms"] / 1000, 2) if cur["avg_detection_ms"] is not None else None,
                "delta": pct_change(cur["avg_detection_ms"], prev["avg_detection_ms"]),
            },
        },
        "series": daily_series(db, start_dt, end_dt),
        "risk_distribution": risk,
        "risk_total": sum(b["count"] for b in risk),
        "fraud_types": type_distribution(db, start_dt, end_dt),
        "recent_alerts": [
            tx_dict(t) for t in db.query(Transaction)
            .filter(Transaction.is_fraud_predicted == True, Transaction.handled == False)  # noqa: E712
            .order_by(Transaction.created_at.desc(), Transaction.id.desc()).limit(5).all()
        ],
        "open_alerts": db.query(Transaction).filter(
            Transaction.is_fraud_predicted == True, Transaction.handled == False).count(),  # noqa: E712
        "recent_transactions": [
            tx_dict(t) for t in in_period(db.query(Transaction), start_dt, end_dt)
            .order_by(Transaction.created_at.desc(), Transaction.id.desc()).limit(8).all()
        ],
    }
