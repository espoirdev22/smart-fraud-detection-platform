from pydantic import BaseModel


class TransactionInput(BaseModel):
    type: str          # CASH_IN, CASH_OUT, DEBIT, PAYMENT, TRANSFER
    amount: float
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float
    step: int = 1


class PredictionOutput(BaseModel):
    fraud_probability: float
    is_fraud: bool
    threshold_used: float