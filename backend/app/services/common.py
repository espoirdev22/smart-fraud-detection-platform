"""Petits outils partages par les routers : periodes, serialisation, statistiques."""
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Transaction


def aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def iso(dt: Optional[datetime]) -> Optional[str]:
    dt = aware(dt)
    return dt.isoformat() if dt else None


def resolve_period(start: Optional[date], end: Optional[date]):
    """Retourne (debut, fin_exclue, debut_precedent). Par defaut : 7 derniers jours."""
    end = end or datetime.now(timezone.utc).date()
    start = start or end - timedelta(days=6)
    if start > end:
        raise HTTPException(400, "La date de debut doit preceder la date de fin.")
    days = (end - start).days + 1
    if days > 366:
        raise HTTPException(400, "La periode ne peut pas depasser 366 jours.")
    to_dt = lambda d: datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    start_dt = to_dt(start)
    end_dt = to_dt(end + timedelta(days=1))
    prev_start = start_dt - timedelta(days=days)
    return start_dt, end_dt, prev_start


def in_period(query, start_dt, end_dt):
    return query.filter(Transaction.created_at >= start_dt, Transaction.created_at < end_dt)


def period_totals(db: Session, start_dt, end_dt) -> dict:
    q = in_period(db.query(Transaction), start_dt, end_dt)
    total = q.count()
    suspicious = q.filter(Transaction.is_fraud_predicted == True).count()  # noqa: E712
    false_pos = q.filter(Transaction.is_fraud_predicted == True, Transaction.handled == True).count()  # noqa: E712
    avg_ms = in_period(db.query(func.avg(Transaction.detection_ms)), start_dt, end_dt).scalar()
    return {
        "total": total,
        "suspicious": suspicious,
        "fraud_rate": (suspicious / total * 100) if total else 0.0,
        "false_positives": false_pos,
        "avg_detection_ms": float(avg_ms) if avg_ms is not None else None,
    }


def pct_change(current, previous):
    """Variation en % ; None si la periode precedente n'a pas de donnees."""
    if current is None or previous in (None, 0):
        return None
    return round((current - previous) / previous * 100, 1)


def status_label(action: Optional[str]) -> str:
    return {"BLOCK": "Fraude probable", "VERIFY": "À vérifier"}.get(action, "Sain")


def tx_dict(t: Transaction) -> dict:
    return {
        "id": t.id,
        "type": t.type,
        "amount": t.amount,
        "phone": t.phone,
        "location": t.location,
        "fraud_probability": t.fraud_probability,
        "score": t.score,
        "action": t.action or ("VERIFY" if t.is_fraud_predicted else "PASS"),
        "status": status_label(t.action or ("VERIFY" if t.is_fraud_predicted else "PASS")),
        "is_fraud_predicted": t.is_fraud_predicted,
        "handled": bool(t.handled),
        "detection_ms": t.detection_ms,
        "source": t.source,
        "created_at": iso(t.created_at),
    }
