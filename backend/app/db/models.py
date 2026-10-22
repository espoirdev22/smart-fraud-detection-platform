from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, text
from sqlalchemy.sql import func

from app.db.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    old_balance_orig = Column(Float)
    new_balance_orig = Column(Float)
    old_balance_dest = Column(Float)
    new_balance_dest = Column(Float)
    fraud_probability = Column(Float, nullable=False)
    is_fraud_predicted = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Champs ajoutes pour le tableau de bord (ajoutes aux anciennes lignes par db/migrate.py)
    phone = Column(String, index=True)
    location = Column(String)
    score = Column(Integer)
    action = Column(String, index=True)          # PASS, VERIFY ou BLOCK
    factors = Column(JSON)                       # facteurs SHAP (top 4) avec leur part
    detection_ms = Column(Float)                 # temps reel de l'analyse, en millisecondes
    handled = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    handled_at = Column(DateTime(timezone=True))
    source = Column(String, nullable=False, default="live", server_default=text("'live'"))


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String)
    password_hash = Column(String)
    role = Column(String, nullable=False, default="Analyste Fraude")
    active = Column(Boolean, nullable=False, default=True, server_default=text("true"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
