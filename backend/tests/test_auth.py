"""Tests de la connexion : badge obligatoire, roles, mots de passe."""
import os
import tempfile

_db = os.path.join(tempfile.mkdtemp(), "auth.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db}"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.core.security import hash_password, verify_password, create_token  # noqa: E402


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def login(client, email=None, password=None):
    return client.post("/auth/login", json={
        "email": email or settings.admin_email, "password": password or settings.admin_password})


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_password_hash_roundtrip():
    h = hash_password("Secret123")
    assert h != "Secret123" and verify_password("Secret123", h)
    assert not verify_password("autre", h) and not verify_password("x", None)


def test_routes_closed_without_token(client):
    for path in ("/transactions", "/alerts", "/dashboard/summary", "/users", "/settings", "/reports/summary"):
        assert client.get(path).status_code == 401, path
    assert client.post("/predict", json={}).status_code == 401
    assert client.get("/health").status_code == 200


def test_login_ok_and_me(client):
    r = login(client)
    assert r.status_code == 200
    body = r.json()
    assert body["user"]["role"] == "Administrateur" and "password" not in str(body["user"])
    me = client.get("/auth/me", headers=auth(body["access_token"]))
    assert me.status_code == 200 and me.json()["email"] == settings.admin_email
    assert client.get("/transactions", headers=auth(body["access_token"])).status_code == 200


def test_wrong_password_and_unknown_email(client):
    assert login(client, password="faux").status_code == 401
    assert login(client, email="inconnu@x.com").status_code == 401


def test_bad_or_forged_token(client):
    assert client.get("/auth/me", headers=auth("n-importe-quoi")).status_code == 401
    forged = create_token(1, "Administrateur")[0][:-3] + "abc"
    assert client.get("/auth/me", headers=auth(forged)).status_code == 401


def make_user(client, admin_token, email, role):
    r = client.post("/users", headers=auth(admin_token), json={
        "name": "Test " + role, "email": email, "role": role, "password": "MotDePasse1"})
    assert r.status_code == 201, r.text
    return auth(login(client, email, "MotDePasse1").json()["access_token"])


def test_roles_matrix(client):
    admin = login(client).json()["access_token"]
    analyste = make_user(client, admin, "analyste@test.com", "Analyste Fraude")
    superviseur = make_user(client, admin, "superviseur@test.com", "Superviseur")
    admin_h = auth(admin)
    new_user = {"name": "X Y", "role": "Analyste Fraude", "password": "MotDePasse1"}
    thresholds = {"verify": 0.5, "block": 0.9}

    # Tout le monde : tableau de bord, alertes, transactions, statut systeme
    for h in (analyste, superviseur, admin_h):
        for path in ("/alerts", "/transactions", "/dashboard/summary", "/system/status", "/models"):
            assert client.get(path, headers=h).status_code == 200, path

    # Analyste : ni rapports, ni parametres, ni liste des comptes
    for path in ("/reports/summary", "/reports/export.csv", "/settings", "/users"):
        assert client.get(path, headers=analyste).status_code == 403, path
    assert client.put("/settings/thresholds", headers=analyste, json=thresholds).status_code == 403
    assert client.post("/users", headers=analyste, json=new_user).status_code == 403

    # Superviseur : rapports, seuils et liste des comptes, mais pas de gestion des comptes
    for path in ("/reports/summary", "/reports/export.csv", "/settings", "/users"):
        assert client.get(path, headers=superviseur).status_code == 200, path
    assert client.put("/settings/thresholds", headers=superviseur, json=thresholds).status_code == 200
    assert client.post("/users", headers=superviseur, json=new_user).status_code == 403
    assert client.patch("/users/1", headers=superviseur, json={"name": "Autre nom"}).status_code == 403

    # Administrateur : tout
    assert client.post("/users", headers=admin_h, json={**new_user, "email": "nouveau@test.com"}).status_code == 201


def test_deactivated_user_cannot_login_or_use_token(client):
    admin = login(client).json()["access_token"]
    created = client.post("/users", headers=auth(admin), json={
        "name": "Temp User", "email": "temp@test.com", "role": "Superviseur", "password": "MotDePasse1"}).json()
    token = login(client, "temp@test.com", "MotDePasse1").json()["access_token"]
    client.patch(f"/users/{created['id']}", headers=auth(admin), json={"active": False})
    assert login(client, "temp@test.com", "MotDePasse1").status_code == 401
    assert client.get("/auth/me", headers=auth(token)).status_code == 401


def test_admin_cannot_demote_self_and_duplicate_email(client):
    admin = login(client).json()
    me_id = admin["user"]["id"]
    h = auth(admin["access_token"])
    assert client.patch(f"/users/{me_id}", headers=h, json={"role": "Analyste Fraude"}).status_code == 400
    assert client.post("/users", headers=h, json={
        "name": "Doublon", "email": settings.admin_email, "role": "Analyste Fraude",
        "password": "MotDePasse1"}).status_code == 409


def test_change_password(client):
    admin = login(client).json()["access_token"]
    client.post("/users", headers=auth(admin), json={
        "name": "Pwd Test", "email": "pwd@test.com", "role": "Analyste Fraude", "password": "AncienMdp123"})
    h = auth(login(client, "pwd@test.com", "AncienMdp123").json()["access_token"])
    assert client.post("/auth/change-password", headers=h, json={
        "current_password": "faux", "new_password": "NouveauMdp12"}).status_code == 400
    assert client.post("/auth/change-password", headers=h, json={
        "current_password": "AncienMdp123", "new_password": "NouveauMdp12"}).status_code == 200
    assert login(client, "pwd@test.com", "AncienMdp123").status_code == 401
    assert login(client, "pwd@test.com", "NouveauMdp12").status_code == 200
