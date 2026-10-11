"""
Rejoue de vraies lignes PaySim a travers le modele pour remplir le tableau de bord
avant une demo.

Ce qui est reel : les montants, soldes et types viennent du CSV PaySim, le score,
la decision, les facteurs SHAP et le temps d'analyse sont calcules par le modele.
Ce qui est simule : les dates (etalees sur les derniers jours), les numeros de
telephone et les villes, que PaySim ne contient pas. Ces lignes sont marquees
source='replay' pour ne jamais les confondre avec des transactions saisies.

Usage (depuis le dossier backend, avec le modele et la base accessibles) :
    python -m app.scripts.seed_demo --csv ../ml/data/raw/PS_20174392719_1491204439457_log.csv --rows 600 --days 14
"""
import argparse
import random
import time
from datetime import datetime, timedelta, timezone

import pandas as pd

from app.core.config import settings
from app.db.database import Base, engine, SessionLocal
from app.db.migrate import migrate_schema
from app.db.models import Transaction
from app.models.schemas import TransactionInput
from app.routers.predict import decide_action
from app.services.ml_service import predict, display_score, explain
from app.services.settings_service import get_thresholds

CITIES = ["Dakar", "Thiès", "Saint-Louis", "Touba", "Kaolack", "Ziguinchor", "Mbour", "Diourbel"]


def fake_phone(rng: random.Random) -> str:
    prefix = rng.choice(["77", "78", "76", "70", "75"])
    n = f"{rng.randint(0, 9999999):07d}"
    return f"+221 {prefix} {n[:3]} {n[3:5]} {n[5:]}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--rows", type=int, default=600)
    ap.add_argument("--fraud-share", type=float, default=0.03,
                    help="part de vraies fraudes PaySim dans l'echantillon (defaut 3 pour cent)")
    ap.add_argument("--days", type=int, default=14)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    Base.metadata.create_all(bind=engine)
    migrate_schema()
    rng = random.Random(args.seed)

    df = pd.read_csv(args.csv)
    n_fraud = max(1, int(args.rows * args.fraud_share))
    sample = pd.concat([
        df[df.isFraud == 1].sample(n=n_fraud, random_state=args.seed),
        df[df.isFraud == 0].sample(n=args.rows - n_fraud, random_state=args.seed),
    ]).sample(frac=1, random_state=args.seed)

    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        thresholds = get_thresholds(db)
        for _, r in sample.iterrows():
            payload = TransactionInput(
                type=r["type"], amount=float(r["amount"]),
                oldbalanceOrg=float(r["oldbalanceOrg"]), newbalanceOrig=float(r["newbalanceOrig"]),
                oldbalanceDest=float(r["oldbalanceDest"]), newbalanceDest=float(r["newbalanceDest"]),
                step=int(r["step"]),
            )
            started = time.perf_counter()
            raw = predict(payload)
            shown = display_score(raw, settings.score_temperature)
            try:
                factors = explain(payload, top_n=4)
            except Exception:
                factors = []
            ms = round((time.perf_counter() - started) * 1000, 1)
            action = decide_action(raw, thresholds)
            db.add(Transaction(
                type=payload.type, amount=payload.amount,
                old_balance_orig=payload.oldbalanceOrg, new_balance_orig=payload.newbalanceOrig,
                old_balance_dest=payload.oldbalanceDest, new_balance_dest=payload.newbalanceDest,
                fraud_probability=shown, is_fraud_predicted=raw >= thresholds["verify"],
                phone=fake_phone(rng), location=f"{rng.choice(CITIES)}, Sénégal",
                score=round(shown * 1000), action=action, factors=factors, detection_ms=ms,
                created_at=now - timedelta(seconds=rng.randint(0, args.days * 86400)),
                source="replay",
            ))
        db.commit()
    print(f"{len(sample)} transactions rejouees (dont {n_fraud} vraies fraudes PaySim).")


if __name__ == "__main__":
    main()
