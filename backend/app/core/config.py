import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "postgresql://fraud_admin:fraudpass123@localhost:5432/fraud_detection")
    model_path: str = os.getenv("MODEL_PATH", "../ml/models/model_v1.pkl")
    fraud_threshold: float = float(os.getenv("FRAUD_THRESHOLD", "0.5"))

    score_temperature: float = float(os.getenv("SCORE_TEMPERATURE", "5.0"))
    verify_threshold: float = float(os.getenv("VERIFY_THRESHOLD", "0.5"))
    block_threshold: float = float(os.getenv("BLOCK_THRESHOLD", "0.93"))

    class Config:
        env_file = ".env"


settings = Settings()