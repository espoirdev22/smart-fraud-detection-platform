import csv
import io
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends

from app.core.deps import require_supervisor
from fastapi.responses import StreamingResponse
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Transaction
from app.services.common import resolve_period, in_period, period_totals, tx_dict
from app.routers.dashboard import daily_series

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary", dependencies=[Depends(require_supervisor)])
def report_summary(start: Optional[date] = None, end: Optional[date] = None, db: Session = Depends(get_db)):
    from datetime import timedelta
    start_dt, end_dt, _ = resolve_period(start, end)
    totals = period_totals(db, start_dt, end_dt)

    flagged = case((Transaction.is_fraud_predicted == True, 1), else_=0)  # noqa: E712
    blocked = case((Transaction.action == "BLOCK", 1), else_=0)
    flagged_amount = case((Transaction.is_fraud_predicted == True, Transaction.amount), else_=0.0)  # noqa: E712
    by_type = (
        in_period(db.query(Transaction.type, func.count(Transaction.id), func.sum(flagged), func.sum(blocked),
                           func.sum(Transaction.amount), func.sum(flagged_amount)), start_dt, end_dt)
        .group_by(Transaction.type).order_by(func.count(Transaction.id).desc()).all()
    )
    top_phones = (
        in_period(db.query(Transaction.phone, func.count(Transaction.id), func.max(Transaction.fraud_probability)),
                  start_dt, end_dt)
        .filter(Transaction.is_fraud_predicted == True, Transaction.phone.isnot(None))  # noqa: E712
        .group_by(Transaction.phone).order_by(func.count(Transaction.id).desc()).limit(10).all()
    )
    return {
        "period": {"start": start_dt.date().isoformat(), "end": (end_dt.date() - timedelta(days=1)).isoformat()},
        "totals": totals,
        "amount_total": float(in_period(db.query(func.sum(Transaction.amount)), start_dt, end_dt).scalar() or 0),
        "amount_flagged": float(in_period(db.query(func.sum(flagged_amount)), start_dt, end_dt).scalar() or 0),
        "by_type": [{"type": r[0], "count": r[1], "suspicious": int(r[2] or 0), "blocked": int(r[3] or 0),
                     "amount": float(r[4] or 0), "amount_suspicious": float(r[5] or 0)} for r in by_type],
        "by_day": daily_series(db, start_dt, end_dt),
        "top_phones": [{"phone": r[0], "alerts": r[1], "max_score": round(r[2], 2)} for r in top_phones],
    }


@router.get("/export.csv", dependencies=[Depends(require_supervisor)])
def export_csv(start: Optional[date] = None, end: Optional[date] = None, db: Session = Depends(get_db)):
    start_dt, end_dt, _ = resolve_period(start, end)
    rows = in_period(db.query(Transaction), start_dt, end_dt).order_by(Transaction.created_at).all()
    buf = io.StringIO()
    writer = csv.writer(buf, delimiter=";")
    writer.writerow(["id", "date", "telephone", "localisation", "type", "montant_fcfa", "score", "decision",
                     "statut", "traite", "temps_analyse_ms"])
    for t in rows:
        d = tx_dict(t)
        writer.writerow([d["id"], d["created_at"], d["phone"] or "", d["location"] or "", d["type"], d["amount"],
                         d["score"], d["action"], d["status"], "oui" if d["handled"] else "non",
                         d["detection_ms"] if d["detection_ms"] is not None else ""])
    buf.seek(0)
    name = f"rapport_{start_dt.date()}_{(end_dt.date())}.csv"
    return StreamingResponse(iter(["﻿" + buf.getvalue()]), media_type="text/csv; charset=utf-8",
                             headers={"Content-Disposition": f'attachment; filename="{name}"'})
