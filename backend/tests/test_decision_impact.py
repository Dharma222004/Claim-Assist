import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
import app.database as app_db
from app.decision_impact import DownstreamDecisionImpactEngine

# Isolated in-memory database setup for decision impact tests
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


def test_decision_impact_engine_mapping():
    """Test DownstreamDecisionImpactEngine rule-based impact mapping."""
    engine = DownstreamDecisionImpactEngine()
    
    # Mock data quality report with low score
    dq_mock = {
        "datasets": {
            "Carrier": {"overall_quality_score": 75.0, "details": {"negative_cost_count": 5}}
        }
    }
    # Mock ML authorization event
    auth_mock = {
        "auth_id": "AUTH_TEST_888",
        "prediction": "ANOMALY",
        "probability": 0.95,
        "final_priority": "CRITICAL",
        "sla_risk": "HIGH"
    }

    impacts = engine.evaluate_decision_impacts(data_quality_report=dq_mock, authorization_event=auth_mock)
    assert len(impacts) >= 2
    
    areas = [imp["impact_area"] for imp in impacts]
    assert "CLAIMS_ANALYTICS" in areas
    assert "AUTHORIZATION_WORKFLOW" in areas
    assert "CARE_MANAGEMENT" in areas


def test_api_decision_impact_report_endpoint():
    """Test GET /api/decision-impact/report API endpoint."""
    response = client.get("/api/decision-impact/report")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "impacts" in data
    assert data["summary"]["total_downstream_impacts_identified"] >= 0
