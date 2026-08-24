from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import predict, transactions, statistics
from app.db.database import engine, Base
from app.db import models

Base.metadata.create_all(bind=engine)

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

app.include_router(predict.router)
app.include_router(transactions.router)
app.include_router(statistics.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}