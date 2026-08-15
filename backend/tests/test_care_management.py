import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
import app.database as app_db
from app.care_management import CMSCareManagementEngine

# Isolated in-memory database setup for care management tests
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


def test_care_management_engine_extraction():
    """Test operational care management utilization signals extraction from raw CMS data."""
    engine = CMSCareManagementEngine()
    report = engine.extract_care_signals(max_beneficiaries=10)
    assert "summary" in report
    assert "signals" in report
    assert report["summary"]["total_care_signals_generated"] > 0

    # Ensure Part D beneficiary signal reports NOT_AVAILABLE_WITH_SOURCE_DATA
    partd_sig = next((s for s in report["signals"] if s["signal_type"] == "HIGH_PHARMACY_UTILIZATION"), None)
    assert partd_sig is not None
    assert partd_sig["beneficiary_id"] == "NOT_AVAILABLE_WITH_SOURCE_DATA"


def test_api_care_management_signals_endpoint():
    """Test GET /api/care-management/signals API endpoint."""
    response = client.get("/api/care-management/signals")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "signals" in data
    assert data["summary"]["total_care_signals_generated"] > 0


def test_api_beneficiary_decision_context_endpoint():
    """Test GET /api/beneficiary/{id}/decision-context endpoint for non-existent and valid IDs."""
    # Non-existent ID -> NOT_AVAILABLE_WITH_SOURCE_DATA
    res_none = client.get("/api/beneficiary/UNKNOWN_BENE_999/decision-context")
    assert res_none.status_code == 200
    data_none = res_none.json()
    assert data_none["status"] == "NOT_AVAILABLE_WITH_SOURCE_DATA"

    # Known SIM / Auth ID -> AVAILABLE
    res_valid = client.get("/api/beneficiary/SIM_001/decision-context")
    assert res_valid.status_code == 200
    data_valid = res_valid.json()
    assert data_valid["status"] == "AVAILABLE"
