"""
Tests for CAPA improvements
Tests the new CAPA features including enhanced fields, verification, and automation
"""

import pytest
import json
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Import the application and models
from main import app
from models_updated import Base, Capa, User, VerificationStatus, CapaStatus
from database import get_db
from capa_scheduler import CapaScheduler, run_daily_capa_tasks

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_capa.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client():
    """Create a test client"""
    return TestClient(app)

@pytest.fixture(scope="function")
def test_user(db_session):
    """Create a test user"""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        first_name="Test",
        last_name="User",
        role="quality_manager"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_capa(db_session, test_user):
    """Create a test CAPA"""
    capa = Capa(
        title="Test CAPA",
        description="Test description",
        department="Test Department",
        priority="medium",
        status=CapaStatus.PENDING.value,
        target_date=datetime.now() + timedelta(days=30),
        created_by_id=test_user.id,
        root_cause="Test root cause",
        corrective_actions='[{"task": "Test action", "status": "open"}]',
        preventive_actions='[{"task": "Test preventive", "status": "open"}]',
        verification_steps='[{"step": "Test verification", "required": true, "completed": false}]',
        verification_status=VerificationStatus.PENDING.value,
        severity=3,
        estimated_cost=1000.0,
        status_history='[]',
        sla_days=14,
        escalation_level=0
    )
    db_session.add(capa)
    db_session.commit()
    db_session.refresh(capa)
    return capa

class TestCapaModels:
    """Test CAPA model enhancements"""
    
    def test_capa_creation_with_new_fields(self, db_session, test_user):
        """Test creating a CAPA with new enhanced fields"""
        capa = Capa(
            title="Enhanced CAPA",
            description="Test description",
            department="Test Department",
            priority="high",
            status=CapaStatus.PENDING.value,
            target_date=datetime.now() + timedelta(days=30),
            created_by_id=test_user.id,
            root_cause="Root cause analysis",
            corrective_actions='[{"task": "Action 1", "status": "open"}]',
            preventive_actions='[{"task": "Preventive 1", "status": "open"}]',
            verification_steps='[{"step": "Verify 1", "required": true, "completed": false}]',
            verification_status=VerificationStatus.PENDING.value,
            severity=4,
            estimated_cost=5000.0,
            status_history='[]',
            sla_days=21,
            escalation_level=0
        )
        
        db_session.add(capa)
        db_session.commit()
        db_session.refresh(capa)
        
        assert capa.id is not None
        assert capa.root_cause == "Root cause analysis"
        assert capa.severity == 4
        assert capa.estimated_cost == 5000.0
        assert capa.sla_days == 21
        assert capa.escalation_level == 0
        assert capa.verification_status == VerificationStatus.PENDING.value

    def test_capa_json_fields_parsing(self, db_session, test_user):
        """Test parsing of JSON fields in CAPA"""
        corrective_actions = [
            {"task": "Action 1", "status": "open", "due_date": "2025-02-01"},
            {"task": "Action 2", "status": "completed", "completed_at": "2025-01-15"}
        ]
        
        capa = Capa(
            title="JSON Test CAPA",
            description="Test description",
            department="Test Department",
            priority="medium",
            status=CapaStatus.PENDING.value,
            target_date=datetime.now() + timedelta(days=30),
            created_by_id=test_user.id,
            corrective_actions=json.dumps(corrective_actions),
            verification_status=VerificationStatus.PENDING.value,
            severity=3
        )
        
        db_session.add(capa)
        db_session.commit()
        db_session.refresh(capa)
        
        # Test parsing JSON fields
        parsed_actions = json.loads(capa.corrective_actions)
        assert len(parsed_actions) == 2
        assert parsed_actions[0]["task"] == "Action 1"
        assert parsed_actions[1]["status"] == "completed"

class TestCapaAPI:
    """Test CAPA API endpoints"""
    
    def test_create_enhanced_capa(self, client, test_user):
        """Test creating an enhanced CAPA via API"""
        # Mock authentication
        client.app.dependency_overrides[get_current_user] = lambda: test_user
        
        capa_data = {
            "title": "API Test CAPA",
            "description": "Test description for API",
            "department": "Test Department",
            "root_cause": "API test root cause",
            "corrective_actions": [
                {
                    "task": "API Action 1",
                    "due_date": "2025-02-01",
                    "status": "open"
                }
            ],
            "preventive_actions": [
                {
                    "task": "API Preventive 1",
                    "status": "open"
                }
            ],
            "verification_steps": [
                {
                    "step": "API Verification 1",
                    "required": True,
                    "completed": False
                }
            ],
            "severity": 4,
            "estimated_cost": 2500.0,
            "sla_days": 21
        }
        
        response = client.post("/api/capas", json=capa_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "capa_id" in data
        assert data["capa"]["title"] == "API Test CAPA"
        assert data["capa"]["severity"] == 4

    def test_get_enhanced_capas_with_filters(self, client, test_user, test_capa):
        """Test getting CAPAs with filters"""
        # Mock authentication
        client.app.dependency_overrides[get_current_user] = lambda: test_user
        
        response = client.get("/api/capas?severity=3&verification_status=pending")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "capas" in data
        assert len(data["capas"]) >= 1

    def test_get_capa_dashboard_stats(self, client, test_user, test_capa):
        """Test getting CAPA dashboard statistics"""
        # Mock authentication
        client.app.dependency_overrides[get_current_user] = lambda: test_user
        
        response = client.get("/api/capas/dashboard/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "stats" in data
        assert "total_capas" in data["stats"]
        assert data["stats"]["total_capas"] >= 1

class TestCapaScheduler:
    """Test CAPA scheduler functionality"""
    
    def test_check_overdue_capas(self, db_session, test_user):
        """Test checking for overdue CAPAs"""
        # Create an overdue CAPA
        overdue_capa = Capa(
            title="Overdue CAPA",
            description="This CAPA is overdue",
            department="Test Department",
            priority="high",
            status=CapaStatus.PENDING.value,
            target_date=datetime.now() - timedelta(days=5),  # 5 days overdue
            created_by_id=test_user.id,
            verification_status=VerificationStatus.PENDING.value,
            severity=4,
            escalation_level=0
        )
        
        db_session.add(overdue_capa)
        db_session.commit()
        
        # Test the scheduler
        scheduler = CapaScheduler()
        overdue_capas = scheduler.check_overdue_capas()
        
        assert len(overdue_capas) >= 1
        assert overdue_capas[0]["capa_id"] == overdue_capa.id
        assert overdue_capas[0]["days_overdue"] >= 5

    def test_escalate_capa(self, db_session, test_user, test_capa):
        """Test escalating a CAPA"""
        scheduler = CapaScheduler()
        
        # Test escalation
        result = scheduler.escalate_capa(test_capa.id, 5)  # 5 days overdue
        
        assert result is True
        
        # Check if escalation level was increased
        db_session.refresh(test_capa)
        assert test_capa.escalation_level == 1

    def test_update_status_history(self, db_session, test_user, test_capa):
        """Test updating CAPA status history"""
        scheduler = CapaScheduler()
        
        # Update status history
        result = scheduler.update_status_history(
            test_capa.id,
            test_user.id,
            "pending",
            "in_progress",
            "Status updated by test"
        )
        
        assert result is True
        
        # Check if status history was updated
        db_session.refresh(test_capa)
        status_history = json.loads(test_capa.status_history)
        assert len(status_history) == 1
        assert status_history[0]["from_status"] == "pending"
        assert status_history[0]["to_status"] == "in_progress"
        assert status_history[0]["note"] == "Status updated by test"

    def test_run_daily_tasks(self, db_session, test_user):
        """Test running daily CAPA tasks"""
        # Create some test CAPAs
        overdue_capa = Capa(
            title="Overdue CAPA",
            description="This CAPA is overdue",
            department="Test Department",
            priority="high",
            status=CapaStatus.PENDING.value,
            target_date=datetime.now() - timedelta(days=10),
            created_by_id=test_user.id,
            verification_status=VerificationStatus.PENDING.value,
            severity=4,
            escalation_level=0
        )
        
        db_session.add(overdue_capa)
        db_session.commit()
        
        # Run daily tasks
        result = run_daily_capa_tasks()
        
        assert "overdue_capas" in result
        assert "escalated_capas" in result
        assert "reminders_sent" in result
        assert result["overdue_capas"] >= 1

class TestCapaValidation:
    """Test CAPA validation and business rules"""
    
    def test_severity_validation(self, db_session, test_user):
        """Test severity level validation"""
        # Test valid severity levels
        for severity in [1, 2, 3, 4, 5]:
            capa = Capa(
                title=f"Test CAPA {severity}",
                description="Test description",
                department="Test Department",
                priority="medium",
                status=CapaStatus.PENDING.value,
                target_date=datetime.now() + timedelta(days=30),
                created_by_id=test_user.id,
                verification_status=VerificationStatus.PENDING.value,
                severity=severity
            )
            db_session.add(capa)
            db_session.commit()
            db_session.refresh(capa)
            assert capa.severity == severity

    def test_sla_days_validation(self, db_session, test_user):
        """Test SLA days validation"""
        # Test valid SLA days
        for sla_days in [1, 7, 14, 30, 90, 365]:
            capa = Capa(
                title=f"Test CAPA {sla_days}",
                description="Test description",
                department="Test Department",
                priority="medium",
                status=CapaStatus.PENDING.value,
                target_date=datetime.now() + timedelta(days=30),
                created_by_id=test_user.id,
                verification_status=VerificationStatus.PENDING.value,
                severity=3,
                sla_days=sla_days
            )
            db_session.add(capa)
            db_session.commit()
            db_session.refresh(capa)
            assert capa.sla_days == sla_days

    def test_verification_status_enum(self, db_session, test_user):
        """Test verification status enum values"""
        valid_statuses = [
            VerificationStatus.PENDING.value,
            VerificationStatus.IN_REVIEW.value,
            VerificationStatus.VERIFIED.value,
            VerificationStatus.REJECTED.value
        ]
        
        for status in valid_statuses:
            capa = Capa(
                title=f"Test CAPA {status}",
                description="Test description",
                department="Test Department",
                priority="medium",
                status=CapaStatus.PENDING.value,
                target_date=datetime.now() + timedelta(days=30),
                created_by_id=test_user.id,
                verification_status=status,
                severity=3
            )
            db_session.add(capa)
            db_session.commit()
            db_session.refresh(capa)
            assert capa.verification_status == status

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
