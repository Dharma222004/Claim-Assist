import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
import app.database as app_db
from app.cross_domain import CMSCrossDomainEngine

# Isolated in-memory database setup for cross-domain tests
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

app_db.engine = test_engine
app_db.SessionLocal = TestingSessionLocal


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


client = TestClient(app)


def test_cms_cross_domain_engine_checks():
    """Test CMSCrossDomainEngine execution, corrected finding classifications, and 100% score."""
    engine = CMSCrossDomainEngine()
    report = engine.run_all_checks()
    assert "summary" in report
    assert "checks" in report
    assert report["summary"]["total_cross_domain_checks"] == 6
    assert report["summary"]["checks_performed"] == 5
    assert report["summary"]["checks_not_linkable"] == 1
    assert report["summary"]["actionable_violations"] == 0
    assert report["summary"]["expected_differences"] >= 0
    assert report["summary"]["informational_findings"] >= 0
    assert report["summary"]["overall_cross_domain_consistency_score"] == 100.0


def test_cms_cross_domain_not_linkable_check():
    """Test that Beneficiary to Part D linkage is explicitly reported as NOT_LINKABLE_WITH_AVAILABLE_KEYS."""
    engine = CMSCrossDomainEngine()
    report = engine.run_all_checks()
    partd_check = next((c for c in report["checks"] if c["check_name"] == "BENEFICIARY_PARTD_LINKAGE"), None)
    assert partd_check is not None
    assert partd_check["status"] == "NOT_LINKABLE_WITH_AVAILABLE_KEYS"
    assert partd_check["finding_type"] == "NOT_LINKABLE_WITH_AVAILABLE_KEYS"
    assert partd_check["key_relationship_used"] == "NOT_LINKABLE_WITH_AVAILABLE_KEYS"


def test_carrier_partd_provider_finding_type():
    """Test that Carrier physician to Part D prescriber NPI non-overlap is classified as EXPECTED_DIFFERENCE with 0 actionable violations."""
    engine = CMSCrossDomainEngine()
    report = engine.run_all_checks()
    check = next((c for c in report["checks"] if c["check_name"] == "CARRIER_PARTD_PROVIDER_NPI_MATCH"), None)
    assert check is not None
    assert check["finding_type"] == "EXPECTED_DIFFERENCE"
    assert check["actionable_violations"] == 0
    assert check["expected_differences"] >= 0
    assert check["violation_rate"] == 0.0



def test_api_cross_domain_report_endpoint():
    """Test GET /api/cross-domain/report API endpoint."""
    response = client.get("/api/cross-domain/report")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "checks" in data
    assert data["summary"]["total_cross_domain_checks"] == 6
    assert data["summary"]["overall_cross_domain_consistency_score"] == 100.0
    assert len(data["checks"]) == 6


def test_api_stats_extended_cross_domain():
    """Test that GET /api/stats returns extended cross-domain audit metadata."""
    client.get("/api/cross-domain/report")

    res = client.get("/api/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "cross_domain_consistency" in stats
    assert stats["cross_domain_consistency"]["audited_checks_count"] >= 6
    assert stats["cross_domain_consistency"]["status"] == "AUDITED"
