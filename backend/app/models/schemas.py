import re
from typing import Optional

from pydantic import BaseModel, field_validator

PHONE_RE = re.compile(r"^\+?[0-9 ]{8,20}$")


class TransactionInput(BaseModel):
    type: str          # CASH_IN, CASH_OUT, DEBIT, PAYMENT, TRANSFER
    amount: float
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float
    step: int = 1
    phone: Optional[str] = None
    location: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        if v is None or v.strip() == "":
            return None
        v = v.strip()
        if not PHONE_RE.match(v):
            raise ValueError("Numero de telephone invalide")
        return v

    @field_validator("location")
    @classmethod
    def clean_location(cls, v):
        return v.strip()[:80] if v and v.strip() else None


class FactorOutput(BaseModel):
    feature: str
    impact: float
    direction: str
    share: float = 0.0


class PredictionOutput(BaseModel):
    id: int
    fraud_probability: float
    score: int
    action: str
    is_fraud: bool
    threshold_used: float
    detection_ms: float
    factors: list[FactorOutput] = []
