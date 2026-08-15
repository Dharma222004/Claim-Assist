import os
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime, Text, BigInteger
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Load environment variables from .env (project root or final_anomaly_system)
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent

for env_file in [PROJECT_ROOT / ".env", BASE_DIR / ".env"]:
    if env_file.exists():
        load_dotenv(env_file, override=True)

LOCAL_SQLITE_PATH = BASE_DIR / "final_anomaly.db"
DEFAULT_PG_URL = "postgresql+psycopg://postgres:password@localhost:5432/final_anomaly"

# Read DATABASE_URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_PG_URL)


def create_db_engine(url: str):
    """Create SQLAlchemy engine with appropriate connection parameters."""
    if "sqlite" in url:
        connect_args = {"check_same_thread": False}
        eng = create_engine(url, connect_args=connect_args, echo=False)
        try:
            from sqlalchemy import text
            with eng.connect() as conn:
                conn.execute(text("PRAGMA journal_mode=WAL;"))
        except Exception:
            pass
        return eng
    else:
        # PostgreSQL configuration with 3s connect_timeout
        return create_engine(
            url,
            connect_args={"connect_timeout": 3},
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=False
        )


# Initialize engine & SessionLocal with fallback
try:
    engine = create_db_engine(DATABASE_URL)
    with engine.connect() as conn:
        pass
except Exception as e:
    FALLBACK_URL = f"sqlite:///{LOCAL_SQLITE_PATH.as_posix()}"
    print(f"Primary database connection failed ({e}). Falling back to SQLite: {FALLBACK_URL}")
    DATABASE_URL = FALLBACK_URL
    engine = create_db_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class AuthorizationRecord(Base):
    """SQLAlchemy ORM model for authorization predictions & hybrid risk evaluations."""
    __tablename__ = "authorization_records"

    id = Column(Integer, primary_key=True, index=True)
    auth_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Base input summary
    ml_req_units = Column(Float, default=0.0)
    ml_aprvd_units = Column(Float, default=0.0)
    ml_latency_hours = Column(Float, default=0.0)
    ml_bene_age = Column(Float, default=0.0)
    ml_prov_partd_cost = Column(Float, default=0.0)

    # ML Inference Results
    prediction = Column(String(16), nullable=False)        # "NORMAL" or "ANOMALY"
    probability = Column(Float, nullable=False)            # 0.0 to 1.0
    ml_risk_level = Column(String(16), nullable=False)      # "LOW", "MEDIUM", "HIGH", "CRITICAL"

    # Business Rules & SLA Evaluation
    rule_violations_count = Column(Integer, default=0)
    sla_risk = Column(String(16), nullable=False)           # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    final_priority = Column(String(16), nullable=False)     # "LOW", "MEDIUM", "HIGH", "CRITICAL"

    # Explanations & Performance
    reasons_json = Column(Text, default="[]")
    inference_latency_ms = Column(Float, default=0.0)

    @property
    def reasons(self) -> List[str]:
        try:
            return json.loads(self.reasons_json or "[]")
        except Exception:
            return []

    @reasons.setter
    def reasons(self, val: List[str]):
        self.reasons_json = json.dumps(val or [])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "auth_id": self.auth_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "ml_req_units": self.ml_req_units,
            "ml_aprvd_units": self.ml_aprvd_units,
            "ml_latency_hours": self.ml_latency_hours,
            "ml_bene_age": self.ml_bene_age,
            "ml_prov_partd_cost": self.ml_prov_partd_cost,
            "prediction": self.prediction,
            "probability": self.probability,
            "risk_level": self.ml_risk_level,
            "rule_violations_count": self.rule_violations_count,
            "sla_risk": self.sla_risk,
            "final_priority": self.final_priority,
            "reasons": self.reasons,
            "inference_latency_ms": self.inference_latency_ms,
        }


class CMSFreshnessRecord(Base):
    """SQLAlchemy ORM model for storing CMS raw dataset ingestion and freshness metadata."""
    __tablename__ = "cms_freshness_records"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(64), index=True, nullable=False)
    source_file = Column(String(128), nullable=False)
    reporting_period = Column(String(32), nullable=False)
    file_size_bytes = Column(BigInteger, default=0)
    file_modified_time = Column(String(64), nullable=True)
    latest_data_date = Column(String(32), nullable=True)
    rows_available = Column(BigInteger, default=0)
    rows_evaluated = Column(BigInteger, default=0)
    coverage_percentage = Column(Float, default=0.0)
    ingestion_duration_ms = Column(Float, default=0.0)
    freshness_status = Column(String(32), nullable=False)
    audited_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "dataset_name": self.dataset_name,
            "source_file": self.source_file,
            "reporting_period": self.reporting_period,
            "file_size_bytes": self.file_size_bytes,
            "file_modified_time": self.file_modified_time,
            "latest_data_date": self.latest_data_date,
            "rows_available": self.rows_available,
            "rows_evaluated": self.rows_evaluated,
            "coverage_percentage": self.coverage_percentage,
            "ingestion_duration_ms": self.ingestion_duration_ms,
            "freshness_status": self.freshness_status,
            "audited_at": self.audited_at.isoformat() if self.audited_at else None,
        }


class CMSCrossDomainRecord(Base):
    """SQLAlchemy ORM model for storing CMS cross-domain consistency evaluation results."""
    __tablename__ = "cms_cross_domain_records"

    id = Column(Integer, primary_key=True, index=True)
    check_name = Column(String(64), index=True, nullable=False)
    source_dataset = Column(String(64), nullable=False)
    target_dataset = Column(String(64), nullable=False)
    key_relationship_used = Column(String(128), nullable=False)
    status = Column(String(64), nullable=False)
    finding_type = Column(String(64), default="INFORMATIONAL")
    evaluation_mode = Column(String(32), default="SAMPLE")
    rows_available = Column(BigInteger, default=0)
    rows_evaluated = Column(BigInteger, default=0)
    coverage_percentage = Column(Float, default=0.0)
    records_checked = Column(BigInteger, default=0)
    actionable_violations = Column(BigInteger, default=0)
    expected_differences = Column(BigInteger, default=0)
    informational_findings = Column(BigInteger, default=0)
    violation_rate = Column(Float, default=0.0)
    severity = Column(String(16), nullable=False)
    explanation = Column(Text, nullable=False)
    audited_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "check_name": self.check_name,
            "source_dataset": self.source_dataset,
            "target_dataset": self.target_dataset,
            "key_relationship_used": self.key_relationship_used,
            "status": self.status,
            "finding_type": self.finding_type,
            "evaluation_mode": self.evaluation_mode,
            "rows_available": self.rows_available,
            "rows_evaluated": self.rows_evaluated,
            "coverage_percentage": self.coverage_percentage,
            "records_checked": self.records_checked,
            "actionable_violations": self.actionable_violations,
            "expected_differences": self.expected_differences,
            "informational_findings": self.informational_findings,
            "violation_rate": self.violation_rate,
            "severity": self.severity,
            "explanation": self.explanation,
            "audited_at": self.audited_at.isoformat() if self.audited_at else None,
        }


class CMSDecisionImpactRecord(Base):
    """SQLAlchemy ORM model for decision impact mapping results."""
    __tablename__ = "decision_impact_records"

    id = Column(Integer, primary_key=True, index=True)
    impact_area = Column(String(64), index=True, nullable=False)
    severity = Column(String(16), nullable=False)
    source_issue = Column(String(128), nullable=False)
    reason = Column(Text, nullable=False)
    confidence_score = Column(Float, default=1.0)
    recommended_action = Column(Text, nullable=False)
    audited_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "impact_area": self.impact_area,
            "severity": self.severity,
            "source_issue": self.source_issue,
            "reason": self.reason,
            "confidence_score": self.confidence_score,
            "recommended_action": self.recommended_action,
            "audited_at": self.audited_at.isoformat() if self.audited_at else None,
        }


class CMSCareManagementSignalRecord(Base):
    """SQLAlchemy ORM model for operational care management utilization signals."""
    __tablename__ = "care_management_signals"

    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(String(64), index=True, nullable=False)
    signal_type = Column(String(64), index=True, nullable=False)
    severity = Column(String(16), nullable=False)
    evidence = Column(Text, nullable=False)
    recommended_review = Column(Text, nullable=False)
    audited_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "beneficiary_id": self.beneficiary_id,
            "signal_type": self.signal_type,
            "severity": self.severity,
            "evidence": self.evidence,
            "recommended_review": self.recommended_review,
            "audited_at": self.audited_at.isoformat() if self.audited_at else None,
        }


class AuditCacheRecord(Base):
    """SQLAlchemy ORM model for persisting completed CMS audit reports (DQ, Freshness, Cross-Domain, Care Mgmt, Decision Impact)."""
    __tablename__ = "audit_cache_records"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(64), unique=True, index=True, nullable=False)
    report_json = Column(Text, nullable=False)
    source_mtime_hash = Column(String(128), nullable=True)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self) -> Dict[str, Any]:
        data = json.loads(self.report_json) if self.report_json else {}
        data["_cached_metadata"] = {
            "cached": True,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "source_mtime_hash": self.source_mtime_hash
        }
        return data


def get_audit_cache(db: Session, report_type: str) -> Optional[Dict[str, Any]]:
    """Retrieve persisted audit report cache from database."""
    try:
        rec = db.query(AuditCacheRecord).filter(AuditCacheRecord.report_type == report_type).first()
        if rec:
            return rec.to_dict()
    except Exception as err:
        print(f"Error querying audit cache for {report_type}: {err}")
    return None


def set_audit_cache(db: Session, report_type: str, data: Dict[str, Any], source_mtime_hash: Optional[str] = None):
    """Persist completed audit report to database cache."""
    try:
        rec = db.query(AuditCacheRecord).filter(AuditCacheRecord.report_type == report_type).first()
        if not rec:
            rec = AuditCacheRecord(report_type=report_type)
            db.add(rec)
        rec.report_json = json.dumps(data)
        rec.source_mtime_hash = source_mtime_hash
        rec.generated_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as err:
        db.rollback()
        print(f"Error persisting audit cache for {report_type}: {err}")


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)



def get_db():
    """Dependency helper for FastAPI session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_authorization_record(db: Session, record_data: Dict[str, Any]) -> AuthorizationRecord:
    """Save an authorization record to database."""
    reasons_list = record_data.get("reasons", [])
    rec = AuthorizationRecord(
        auth_id=record_data.get("auth_id", "AUTH_UNKNOWN"),
        timestamp=datetime.now(timezone.utc),
        ml_req_units=float(record_data.get("ml_req_units", 0.0)),
        ml_aprvd_units=float(record_data.get("ml_aprvd_units", 0.0)),
        ml_latency_hours=float(record_data.get("ml_latency_hours", 0.0)),
        ml_bene_age=float(record_data.get("ml_bene_age", 0.0)),
        ml_prov_partd_cost=float(record_data.get("ml_prov_partd_cost", 0.0)),
        prediction=record_data.get("prediction", "NORMAL"),
        probability=float(record_data.get("probability", 0.0)),
        ml_risk_level=record_data.get("risk_level", "LOW"),
        rule_violations_count=int(record_data.get("rule_violations_count", 0)),
        sla_risk=record_data.get("sla_risk", "LOW"),
        final_priority=record_data.get("final_priority", "LOW"),
        reasons_json=json.dumps(reasons_list),
        inference_latency_ms=float(record_data.get("inference_latency_ms", 0.0)),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def save_cms_freshness_records(db: Session, reports_dict: Dict[str, Any]):
    """Persist CMS dataset freshness audit metadata into database."""
    try:
        for name, data in reports_dict.items():
            rec = CMSFreshnessRecord(
                dataset_name=data.get("dataset_name", name),
                source_file=data.get("source_file", "unknown"),
                reporting_period=data.get("reporting_period", "N/A"),
                file_size_bytes=int(data.get("file_size_bytes", 0)),
                file_modified_time=data.get("file_modified_time"),
                latest_data_date=data.get("latest_data_date"),
                rows_available=int(data.get("rows_available", 0)),
                rows_evaluated=int(data.get("rows_evaluated", 0)),
                coverage_percentage=float(data.get("coverage_percentage", 0.0)),
                ingestion_duration_ms=float(data.get("ingestion_duration_ms", 0.0)),
                freshness_status=data.get("freshness_status", "AVAILABLE"),
                audited_at=datetime.now(timezone.utc)
            )
            db.add(rec)
        db.commit()
    except Exception as err:
        db.rollback()
        print(f"Error persisting freshness metadata: {err}")


def save_cms_cross_domain_records(db: Session, checks_list: List[Dict[str, Any]]):
    """Persist CMS cross-domain audit check results into PostgreSQL database."""
    try:
        for check in checks_list:
            rec = CMSCrossDomainRecord(
                check_name=check.get("check_name", "UNKNOWN"),
                source_dataset=check.get("source_dataset", "unknown"),
                target_dataset=check.get("target_dataset", "unknown"),
                key_relationship_used=check.get("key_relationship_used", "N/A"),
                status=check.get("status", "PERFORMED"),
                finding_type=check.get("finding_type", "INFORMATIONAL"),
                evaluation_mode=check.get("evaluation_mode", "SAMPLE"),
                rows_available=int(check.get("rows_available", 0)),
                rows_evaluated=int(check.get("rows_evaluated", 0)),
                coverage_percentage=float(check.get("coverage_percentage", 0.0)),
                records_checked=int(check.get("records_checked", 0)),
                actionable_violations=int(check.get("actionable_violations", 0)),
                expected_differences=int(check.get("expected_differences", 0)),
                informational_findings=int(check.get("informational_findings", 0)),
                violation_rate=float(check.get("violation_rate", 0.0)),
                severity=check.get("severity", "LOW"),
                explanation=check.get("explanation", ""),
                audited_at=datetime.now(timezone.utc)
            )
            db.add(rec)
        db.commit()
    except Exception as err:
        db.rollback()
        print(f"Error persisting cross-domain check records: {err}")


def save_cms_decision_impact_records(db: Session, impacts_list: List[Dict[str, Any]]):
    """Persist downstream decision impact records into PostgreSQL database."""
    try:
        for imp in impacts_list:
            rec = CMSDecisionImpactRecord(
                impact_area=imp.get("impact_area", "CLAIMS_ANALYTICS"),
                severity=imp.get("severity", "LOW"),
                source_issue=imp.get("source_issue", "unknown"),
                reason=imp.get("reason", ""),
                confidence_score=float(imp.get("confidence_score", 1.0)),
                recommended_action=imp.get("recommended_action", ""),
                audited_at=datetime.now(timezone.utc)
            )
            db.add(rec)
        db.commit()
    except Exception as err:
        db.rollback()
        print(f"Error persisting decision impact records: {err}")


def save_cms_care_management_signals(db: Session, signals_list: List[Dict[str, Any]]):
    """Persist care management signal records into PostgreSQL database."""
    try:
        for sig in signals_list:
            rec = CMSCareManagementSignalRecord(
                beneficiary_id=sig.get("beneficiary_id", "UNKNOWN"),
                signal_type=sig.get("signal_type", "HIGH_UTILIZATION"),
                severity=sig.get("severity", "LOW"),
                evidence=sig.get("evidence", ""),
                recommended_review=sig.get("recommended_review", ""),
                audited_at=datetime.now(timezone.utc)
            )
            db.add(rec)
        db.commit()
    except Exception as err:
        db.rollback()
        print(f"Error persisting care management signals: {err}")


class LLMExplanationRecord(Base):
    """SQLAlchemy ORM model for storing evidence-grounded LLM explanations."""
    __tablename__ = "llm_explanation_records"

    id = Column(Integer, primary_key=True, index=True)
    issue_type = Column(String(64), index=True, nullable=False)
    reference_id = Column(String(64), index=True, nullable=True)
    provider = Column(String(32), default="ollama")
    model = Column(String(64), default="llama3.2:3b")
    status = Column(String(32), nullable=False)
    likely_cause = Column(Text, nullable=True)
    business_impact = Column(Text, nullable=True)
    recommended_fix = Column(Text, nullable=True)
    evidence_used_json = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "issue_type": self.issue_type,
            "reference_id": self.reference_id,
            "provider": self.provider,
            "model": self.model,
            "status": self.status,
            "likely_cause": self.likely_cause,
            "business_impact": self.business_impact,
            "recommended_fix": self.recommended_fix,
            "evidence_used": json.loads(self.evidence_used_json) if self.evidence_used_json else [],
            "confidence": self.confidence,
            "latency_ms": self.latency_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


def save_llm_explanation_record(db: Session, res_dict: Dict[str, Any], reference_id: Optional[str] = None) -> Optional[LLMExplanationRecord]:
    """Save an evidence-grounded LLM explanation record to PostgreSQL database."""
    try:
        evidence_list = res_dict.get("evidence_used", [])
        rec = LLMExplanationRecord(
            issue_type=res_dict.get("issue_type", "GENERAL"),
            reference_id=reference_id,
            provider=res_dict.get("provider", "ollama"),
            model=res_dict.get("model", "llama3.2:3b"),
            status=res_dict.get("status", "SUCCESS"),
            likely_cause=res_dict.get("likely_cause"),
            business_impact=res_dict.get("business_impact"),
            recommended_fix=res_dict.get("recommended_fix"),
            evidence_used_json=json.dumps(evidence_list),
            confidence=float(res_dict.get("confidence", 0.0)),
            latency_ms=float(res_dict.get("latency_ms", 0.0)),
            created_at=datetime.now(timezone.utc)
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec
    except Exception as err:
        db.rollback()
        print(f"Error persisting LLM explanation record: {err}")
        return None

