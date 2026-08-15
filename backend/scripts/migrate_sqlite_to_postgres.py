import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
project_root = backend_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load .env variables
for env_path in [project_root / ".env", backend_dir / ".env"]:
    if env_path.exists():
        load_dotenv(env_path, override=True)

from app.database import Base, AuthorizationRecord

SQLITE_PATH = backend_dir / "final_anomaly.db"
DEFAULT_PG_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:password@localhost:5432/final_anomaly")


def migrate_data(pg_url: str = DEFAULT_PG_URL):
    """
    Migrate authorization records from SQLite final_anomaly.db into PostgreSQL.
    """
    if not SQLITE_PATH.exists():
        print(f"[MIGRATION NOTICE] SQLite database file not found at: {SQLITE_PATH}")
        print("No existing SQLite records available to migrate.")
        return False, 0

    print(f"Connecting to SQLite database: {SQLITE_PATH}")
    sqlite_engine = create_engine(f"sqlite:///{SQLITE_PATH.as_posix()}", connect_args={"check_same_thread": False})
    SQLiteSession = sessionmaker(bind=sqlite_engine)
    sqlite_db = SQLiteSession()

    try:
        sqlite_records = sqlite_db.query(AuthorizationRecord).all()
    except Exception as e:
        print(f"[MIGRATION NOTICE] Could not query SQLite records: {e}")
        sqlite_db.close()
        return False, 0

    if not sqlite_records:
        print("[MIGRATION NOTICE] SQLite database exists but contains 0 authorization_records.")
        sqlite_db.close()
        return True, 0

    print(f"Found {len(sqlite_records)} records in SQLite database.")

    print(f"Connecting to target PostgreSQL database...")
    try:
        pg_engine = create_engine(pg_url, connect_args={"connect_timeout": 5}, pool_pre_ping=True)
        Base.metadata.create_all(bind=pg_engine)
        PGSession = sessionmaker(bind=pg_engine)
        pg_db = PGSession()
    except Exception as e:
        print(f"[ERROR] Failed to connect to PostgreSQL target: {e}")
        sqlite_db.close()
        return False, 0

    migrated_count = 0
    skipped_count = 0

    try:
        for rec in sqlite_records:
            # Check for duplicate auth_id in PostgreSQL
            exists = pg_db.query(AuthorizationRecord).filter(AuthorizationRecord.auth_id == rec.auth_id).first()
            if exists:
                skipped_count += 1
                continue

            new_rec = AuthorizationRecord(
                auth_id=rec.auth_id,
                timestamp=rec.timestamp,
                ml_req_units=rec.ml_req_units,
                ml_aprvd_units=rec.ml_aprvd_units,
                ml_latency_hours=rec.ml_latency_hours,
                ml_bene_age=rec.ml_bene_age,
                ml_prov_partd_cost=rec.ml_prov_partd_cost,
                prediction=rec.prediction,
                probability=rec.probability,
                ml_risk_level=rec.ml_risk_level,
                rule_violations_count=rec.rule_violations_count,
                sla_risk=rec.sla_risk,
                final_priority=rec.final_priority,
                reasons_json=rec.reasons_json,
                inference_latency_ms=rec.inference_latency_ms,
            )
            pg_db.add(new_rec)
            migrated_count += 1

        pg_db.commit()
        print(f"[SUCCESS] Migration completed: {migrated_count} records inserted, {skipped_count} duplicates skipped.")
        return True, migrated_count
    except Exception as e:
        pg_db.rollback()
        print(f"[ERROR] Transaction error during PostgreSQL insertion: {e}")
        return False, 0
    finally:
        sqlite_db.close()
        pg_db.close()


if __name__ == "__main__":
    target_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PG_URL
    migrate_data(target_url)
