import os
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.skipif(
    not os.path.exists("../ml/models/model_v1.pkl"),
    reason="Modele non disponible dans cet environnement (ex: CI sans acces au fichier .pkl)"
)
def test_predict_normal_transaction():
    payload = {
        "type": "PAYMENT",
        "amount": 5000,
        "oldbalanceOrg": 50000,
        "newbalanceOrig": 45000,
        "oldbalanceDest": 0,
        "newbalanceDest": 0,
        "step": 1,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "fraud_probability" in data
    assert "is_fraud" in data
    assert 0 <= data["fraud_probability"] <= 1


@pytest.mark.skipif(
    not os.path.exists("../ml/models/model_v1.pkl"),
    reason="Modele non disponible dans cet environnement (ex: CI sans acces au fichier .pkl)"
)
def test_predict_fraud_transaction():
    payload = {
        "type": "TRANSFER",
        "amount": 250000,
        "oldbalanceOrg": 250000,
        "newbalanceOrig": 0,
        "oldbalanceDest": 0,
        "newbalanceDest": 0,
        "step": 1,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_fraud"] is True