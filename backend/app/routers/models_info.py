"""Page Modeles & IA : resultats reels des runs MLflow + activite du modele en production."""
import os
import sqlite3
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.db.models import Transaction

router = APIRouter(prefix="/models", tags=["models"])

EXPERIMENT = "fraud-detection-paysim"
CANDIDATES = [os.getenv("MLFLOW_DB_PATH", ""), "/app/mlflow/mlruns.db", "../ml/mlruns.db", "ml/mlruns.db"]


def _find_db():
    for path in CANDIDATES:
        if path and os.path.exists(path) and os.path.getsize(path) > 0:
            return path
    return None


def read_runs(path: str) -> list[dict]:
    conn = sqlite3.connect(f"file:{path}?mode=ro&immutable=1", uri=True)
    try:
        exp = conn.execute("SELECT experiment_id FROM experiments WHERE name = ?", (EXPERIMENT,)).fetchone()
        if not exp:
            return []
        runs = conn.execute(
            "SELECT run_uuid, name, start_time, end_time FROM runs "
            "WHERE experiment_id = ? AND status = 'FINISHED' ORDER BY start_time DESC", (exp[0],)
        ).fetchall()
        out = []
        for uuid, name, start, end in runs:
            metrics = dict(conn.execute("SELECT key, value FROM latest_metrics WHERE run_uuid = ?", (uuid,)).fetchall())
            params = dict(conn.execute("SELECT key, value FROM params WHERE run_uuid = ?", (uuid,)).fetchall())
            out.append({
                "run_id": uuid, "name": name, "metrics": metrics, "params": params,
                "started_at": datetime.fromtimestamp(start / 1000, tz=timezone.utc).isoformat() if start else None,
                "duration_s": round((end - start) / 1000) if start and end else None,
            })
        return out
    finally:
        conn.close()


@router.get("")
def models_overview(db: Session = Depends(get_db)):
    path = _find_db()
    runs = read_runs(path) if path else []
    active_name = os.getenv("ACTIVE_MODEL_NAME", "xgboost")
    active_marked = False
    for r in runs:  # runs tries du plus recent au plus ancien
        r["active"] = (r["name"] == active_name) and not active_marked
        active_marked = active_marked or r["active"]

    by_action = dict(db.query(Transaction.action, func.count(Transaction.id)).group_by(Transaction.action).all())
    avg_ms = db.query(func.avg(Transaction.detection_ms)).scalar()
    return {
        "mlflow_available": path is not None,
        "experiment": EXPERIMENT,
        "runs": runs,
        "active_model": {
            "name": active_name,
            "path": os.path.basename(settings.model_path),
            "file_present": os.path.exists(settings.model_path),
            "score_temperature": settings.score_temperature,
        },
        "production": {
            "predictions": sum(by_action.values()),
            "by_action": {k: by_action.get(k, 0) for k in ("PASS", "VERIFY", "BLOCK")},
            "avg_detection_ms": round(float(avg_ms), 1) if avg_ms is not None else None,
        },
    }
