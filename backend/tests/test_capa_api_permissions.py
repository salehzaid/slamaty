from fastapi.testclient import TestClient
from backend.main import app
from backend.auth import get_current_user


class FakeUser:
    def __init__(self, id: int, role: str):
        self.id = id
        self.role = role


def test_create_capa_forbidden_for_assessor():
    client = TestClient(app)

    fake_user = FakeUser(id=1, role="assessor")
    app.dependency_overrides[get_current_user] = lambda: fake_user

    payload = {
        "title": "Test CAPA",
        "description": "desc",
        "round_id": None,
        "department": "عام",
        "corrective_actions": [],
        "preventive_actions": [],
        "verification_steps": [],
        "severity": 3,
        "estimated_cost": None,
        "sla_days": 14
    }

    resp = client.post("/api/capas", json=payload)
    assert resp.status_code == 403
    assert "permission" in resp.json().get("detail", "").lower()


def test_create_capa_allowed_for_quality_manager():
    client = TestClient(app)

    fake_user = FakeUser(id=2, role="quality_manager")
    app.dependency_overrides[get_current_user] = lambda: fake_user

    payload = {
        "title": "Allowed CAPA",
        "description": "desc",
        "round_id": None,
        "department": "عام",
        "corrective_actions": [],
        "preventive_actions": [],
        "verification_steps": [],
        "severity": 3,
        "estimated_cost": None,
        "sla_days": 14
    }

    resp = client.post("/api/capas", json=payload)
    # Should be success (200 or 201 depending on implementation)
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert data.get("status") == "success"
    assert "capa_id" in data

    # Clean up override
    app.dependency_overrides.clear()


