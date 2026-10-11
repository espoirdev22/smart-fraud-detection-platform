from pydantic import BaseModel


class TransactionInput(BaseModel):
    type: str          # CASH_IN, CASH_OUT, DEBIT, PAYMENT, TRANSFER
    amount: float
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float
    step: int = 1

class FactorOutput(BaseModel):
    feature: str
    impact: float
    direction: str


class PredictionOutput(BaseModel):
    fraud_probability: float
    score: int
    action: str
    is_fraud: bool
    threshold_used: float
    factors: list[FactorOutput] = []

