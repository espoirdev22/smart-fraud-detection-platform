"""
Pipeline de preprocessing complet 
PaySim Fraud Detection
Projet : Smart Fraud Detection Platform
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler


def load_data(path):
    df = pd.read_csv(path)
    print(f"Shape initiale : {df.shape}")
    print(f"Taux de fraude : {df['isFraud'].mean() * 100:.4f}%")
    return df


def clean_data(df):
    df = df.drop(columns=["nameOrig", "nameDest", "isFlaggedFraud"], errors="ignore")
    missing = df.isnull().sum()
    if missing.sum() > 0:
        df = df.dropna()
    return df


def engineer_features(df):
    le = LabelEncoder()
    df["type_encoded"] = le.fit_transform(df["type"])
    df["errorBalanceOrig"] = df["newbalanceOrig"] + df["amount"] - df["oldbalanceOrg"]
    df["errorBalanceDest"] = df["oldbalanceDest"] + df["amount"] - df["newbalanceDest"]
    df["origBalanceEmptied"] = (df["newbalanceOrig"] == 0).astype(int)
    df["hour_of_day"] = df["step"] % 24
    return df, le


def split_data(df, target="isFraud", test_size=0.2, random_state=42):
    feature_cols = [
        "step", "type_encoded", "amount",
        "oldbalanceOrg", "newbalanceOrig",
        "oldbalanceDest", "newbalanceDest",
        "errorBalanceOrig", "errorBalanceDest",
        "origBalanceEmptied", "hour_of_day",
    ]
    X = df[feature_cols]
    y = df[target]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    return X_train, X_test, y_train, y_test, feature_cols


def get_class_weights(y):
    n_neg = (y == 0).sum()
    n_pos = (y == 1).sum()
    return n_neg / n_pos


def run_preprocessing_pipeline(path):
    df = load_data(path)
    df = clean_data(df)
    df, type_encoder = engineer_features(df)
    X_train, X_test, y_train, y_test, feature_cols = split_data(df)
    scale_pos_weight = get_class_weights(y_train)

    return {
        "X_train": X_train, "X_test": X_test,
        "y_train": y_train, "y_test": y_test,
        "feature_cols": feature_cols,
        "scale_pos_weight": scale_pos_weight,
    }