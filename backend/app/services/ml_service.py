"""
Charge le modele XGBoost entraine et expose une fonction de prediction,
utilisee par les routers de l'API.
"""
import joblib
import pandas as pd

from app.core.config import settings

_model = None


def load_model():
    global _model
    if _model is None:
        _model = joblib.load(settings.model_path)
        print(f"Modele charge depuis {settings.model_path}")
    return _model


def build_features(transaction) -> pd.DataFrame:
    """
    Reproduit EXACTEMENT le meme feature engineering que celui utilise
    a l'entrainement (voir ml/src/preprocessing.py), pour garantir que
    le modele recoit des donnees dans le meme format qu'il a appris.
    """
    type_mapping = {"CASH_IN": 0, "CASH_OUT": 1, "DEBIT": 2, "PAYMENT": 3, "TRANSFER": 4}
    type_encoded = type_mapping.get(transaction.type, -1)

    error_balance_orig = transaction.newbalanceOrig + transaction.amount - transaction.oldbalanceOrg
    error_balance_dest = transaction.oldbalanceDest + transaction.amount - transaction.newbalanceDest
    orig_balance_emptied = int(transaction.newbalanceOrig == 0)
    hour_of_day = transaction.step % 24

    return pd.DataFrame([{
        "step": transaction.step,
        "type_encoded": type_encoded,
        "amount": transaction.amount,
        "oldbalanceOrg": transaction.oldbalanceOrg,
        "newbalanceOrig": transaction.newbalanceOrig,
        "oldbalanceDest": transaction.oldbalanceDest,
        "newbalanceDest": transaction.newbalanceDest,
        "errorBalanceOrig": error_balance_orig,
        "errorBalanceDest": error_balance_dest,
        "origBalanceEmptied": orig_balance_emptied,
        "hour_of_day": hour_of_day,
    }])


def predict(transaction) -> float:
    model = load_model()
    X = build_features(transaction)
    probability = model.predict_proba(X)[0][1]
    return float(probability)