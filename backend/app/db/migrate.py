"""
Mise a jour legere du schema.

Base.metadata.create_all() cree les tables manquantes mais n'ajoute jamais de
colonnes a une table existante. Cette fonction compare les colonnes du modele
avec celles de la base et ajoute celles qui manquent, sans toucher aux donnees.
"""
from sqlalchemy import inspect, text

from app.db.database import engine
from app.db.models import Transaction, User

# Valeur par defaut SQL pour les colonnes NOT NULL ajoutees apres coup
_DEFAULTS = {"handled": "FALSE", "source": "'live'"}


def migrate_schema() -> list[str]:
    inspector = inspect(engine)
    added = []
    with engine.begin() as conn:
        for model in (Transaction, User):
            table = model.__tablename__
            if not inspector.has_table(table):
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            for column in model.__table__.columns:
                if column.name in existing:
                    continue
                sql_type = column.type.compile(dialect=engine.dialect)
                default = f" DEFAULT {_DEFAULTS[column.name]}" if column.name in _DEFAULTS else ""
                conn.execute(text(f'ALTER TABLE {table} ADD COLUMN "{column.name}" {sql_type}{default}'))
                added.append(column.name)
        if ("action" in added or "score" in added) and inspector.has_table(Transaction.__tablename__):
            # Anciennes lignes : on deduit la decision et le score depuis ce qui etait stocke.
            conn.execute(text(
                "UPDATE transactions SET action = CASE WHEN is_fraud_predicted THEN 'VERIFY' ELSE 'PASS' END "
                "WHERE action IS NULL"
            ))
            conn.execute(text(
                "UPDATE transactions SET score = CAST(ROUND(fraud_probability * 1000) AS INTEGER) WHERE score IS NULL"
            ))
    return added
