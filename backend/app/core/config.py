import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "postgresql://fraud_admin:fraudpass123@localhost:5432/fraud_detection")
    model_path: str = os.getenv("MODEL_PATH", "../ml/models/model_v1.pkl")
    fraud_threshold: float = float(os.getenv("FRAUD_THRESHOLD", "0.5"))

    score_temperature: float = float(os.getenv("SCORE_TEMPERATURE", "5.0"))
    verify_threshold: float = float(os.getenv("VERIFY_THRESHOLD", "0.5"))
    block_threshold: float = float(os.getenv("BLOCK_THRESHOLD", "0.93"))

    # Authentification. Sans SECRET_KEY dans l'environnement, une cle aleatoire est tiree
    # a chaque demarrage (les sessions sautent quand le conteneur redemarre).
    secret_key: str = os.getenv("SECRET_KEY", "")
    token_minutes: int = int(os.getenv("TOKEN_MINUTES", "480"))
    admin_email: str = os.getenv("ADMIN_EMAIL", "salou@fraudguard.local")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "ChangeMe123!")

    class Config:
        env_file = ".env"


settings = Settings()