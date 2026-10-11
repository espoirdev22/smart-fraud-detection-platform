"""Tests de l'API du tableau de bord, sans modele reel (la prediction est simulee)."""
import os
import tempfile

_db = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db}"

from datetime import datetime, timedelta, timezone  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.db.database import SessionLocal  # noqa: E402
from app.db.models import Transaction  # noqa: E402
import app.routers.predict as predict_router  # noqa: E402


@pytest.fixture()
def client(monkeypatch):
    # Faux modele : le score depend uniquement du type, c'est suffisant pour tester l'API.
    monkeypatch.setattr(predict_router, "predict_fraud", lambda p: 0.99 if p.type == "TRANSFER" else 0.01)
    monkeypatch.setattr(predict_router, "explain", lambda p, top_n=3: [
        {"feature": "Montant", "impact": 2.0, "direction": "hausse", "share": 0.5},
        {"feature": "Type de transaction", "impact": 1.0, "direction": "hausse", "share": 0.25},
    ])
    with TestClient(app) as c:
        with SessionLocal() as db:
            db.query(Transaction).delete()
            db.commit()
        yield c


def post(client, type_="TRANSFER", phone="+221 77 123 45 67"):
    return client.post("/predict", json={
        "type": type_, "amount": 1000, "oldbalanceOrg": 1000, "newbalanceOrig": 0,
        "oldbalanceDest": 0, "newbalanceDest": 1000, "step": 1, "phone": phone, "location": "Dakar, Sénégal",
    })


def test_predict_stores_new_fields(client):
    r = post(client)
    assert r.status_code == 200
    body = r.json()
    assert body["action"] == "BLOCK" and body["detection_ms"] >= 0 and body["id"] > 0
    detail = client.get(f"/transactions/{body['id']}").json()
    assert detail["phone"] == "+221 77 123 45 67"
    assert detail["location"] == "Dakar, Sénégal"
    assert detail["factors"][0]["feature"] == "Montant"


def test_invalid_phone_rejected(client):
    assert post(client, phone="abc").status_code == 422


def test_summary_counts_and_alerts(client):
    post(client, "TRANSFER")
    post(client, "TRANSFER", phone="+221 78 987 65 43")
    post(client, "PAYMENT")
    s = client.get("/dashboard/summary").json()
    assert s["kpis"]["total"]["value"] == 3
    assert s["kpis"]["suspicious"]["value"] == 2
    assert s["kpis"]["fraud_rate"]["value"] == pytest.approx(66.67, abs=0.01)
    assert s["open_alerts"] == 2
    assert s["fraud_types"][0] == {"type": "TRANSFER", "count": 2, "percent": 100.0}
    assert s["kpis"]["total"]["delta"] is None  # pas de periode precedente
    assert sum(d["total"] for d in s["series"]) == 3


def test_handle_makes_false_positive(client):
    tx_id = post(client).json()["id"]
    assert client.get("/alerts/count").json()["open"] == 1
    assert client.patch(f"/transactions/{tx_id}/handle").json()["handled"] is True
    assert client.get("/alerts/count").json()["open"] == 0
    s = client.get("/dashboard/summary").json()
    assert s["kpis"]["false_positives"]["value"] == 1


def test_period_delta(client):
    post(client)
    post(client)
    with SessionLocal() as db:
        old = datetime.now(timezone.utc) - timedelta(days=9)
        db.add(Transaction(type="TRANSFER", amount=1, fraud_probability=0.9, is_fraud_predicted=True,
                           action="BLOCK", score=900, created_at=old, detection_ms=100.0))
        db.commit()
    today = datetime.now(timezone.utc).date()
    s = client.get(f"/dashboard/summary?start={today - timedelta(days=6)}&end={today}").json()
    assert s["kpis"]["total"]["value"] == 2
    assert s["period"]["has_previous"] is True
    assert s["kpis"]["total"]["delta"] == 100.0  # 2 contre 1 sur la periode precedente


def test_search_and_pagination(client):
    for _ in range(3):
        post(client)
    post(client, "PAYMENT", phone="+221 70 111 22 33")
    r = client.get("/transactions/search?q=70 111&limit=10").json()
    assert r["total"] == 1
    assert client.get("/transactions/search?action=BLOCK&limit=2").json()["total"] == 3
    assert len(client.get("/transactions/search?action=BLOCK&limit=2").json()["items"]) == 2


def test_users_and_settings(client):
    me = client.get("/users/me").json()
    assert me["name"] == "Salou Diallo"
    assert client.patch(f"/users/{me['id']}", json={"active": False}).status_code == 400
    assert client.put("/settings/thresholds", json={"verify": 0.9, "block": 0.5}).status_code == 400
    ok = client.put("/settings/thresholds", json={"verify": 0.4, "block": 0.9}).json()
    assert ok["thresholds"] == {"verify": 0.4, "block": 0.9}
    client.put("/settings/thresholds", json={"verify": 0.5, "block": 0.93})


def test_reports_and_models(client):
    post(client)
    rep = client.get("/reports/summary").json()
    assert rep["by_type"][0]["type"] == "TRANSFER"
    csv_text = client.get("/reports/export.csv").text
    assert "telephone" in csv_text and "+221 77 123 45 67" in csv_text
    m = client.get("/models").json()
    assert m["production"]["predictions"] == 1
