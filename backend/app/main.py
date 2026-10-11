from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import predict, transactions, statistics, alerts, dashboard, models_info, reports, users, settings_router
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

app.include_router(predict.router)
app.include_router(transactions.router)
app.include_router(statistics.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)
app.include_router(models_info.router)
app.include_router(reports.router)
app.include_router(users.router)
app.include_router(settings_router.router)


@app.on_event("startup")
def seed_default_user():
    with SessionLocal() as db:
        users.ensure_default_user(db)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}