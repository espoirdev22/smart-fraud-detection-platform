from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())