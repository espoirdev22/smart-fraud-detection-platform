from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import predict, transactions, statistics, alerts, dashboard, models_info, reports, users, settings_router, auth
from app.core.deps import get_current_user
from app.db.database import engine, Base
from app.db import models
from app.db.migrate import migrate_schema
from app.db.database import SessionLocal
from prometheus_fastapi_instrumentator import Instrumentator

Base.metadata.create_all(bind=engine)
migrate_schema()

app = FastAPI(
    title="Smart Fraud Detection Platform - API",
    description="API de detection de fraude sur transactions mobile money (dataset PaySim)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
Instrumentator().instrument(app).expose(app)

app.include_router(auth.router)  # /auth/login est la seule porte ouverte

# Tout le reste exige un badge valide (jeton de connexion).
protected = [Depends(get_current_user)]
for r in (predict.router, transactions.router, statistics.router, alerts.router, dashboard.router,
          models_info.router, reports.router, users.router, settings_router.router):
    app.include_router(r, dependencies=protected)


@app.on_event("startup")
def seed_default_user():
    with SessionLocal() as db:
        users.ensure_default_user(db)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}