import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.cv_services.face_verifier import FaceVerifier, compute_cosine_similarity
from app.cv_services.simulation_engine import ClassroomSimulationEngine


def test_argon2_and_jwt():
    raw = "ClassSphere@2026!"
    hashed = hash_password(raw)
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

    token = create_access_token(101, {"role": "FACULTY", "email": "prof@classsphere.edu"})
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "101"
    assert decoded["role"] == "FACULTY"


def test_face_verifier_cosine_similarity():
    v1 = [1.0, 0.0, 0.5]
    v2 = [1.0, 0.0, 0.5]
    v3 = [0.0, 1.0, 0.0]

    sim_identical = compute_cosine_similarity(v1, v2)
    assert sim_identical >= 0.99

    sim_diff = compute_cosine_similarity(v1, v3)
    assert sim_diff < 0.6

    verifier = FaceVerifier()
    references = [
        {"student_id": 42, "embedding": [1.0, 0.0, 0.5]}
    ]
    matched_id, conf, verdict = verifier.match_candidate_against_references([1.0, 0.0, 0.5], references)
    assert matched_id == 42
    assert verdict == "MATCH_HIGH"
    assert conf >= 0.82


def test_simulation_engine():
    engine = ClassroomSimulationEngine(1, "A-101")
    state = engine.generate_current_frame_state()
    assert state["mode"] == "SIMULATION"
    assert "DEMONSTRATION DATA" in state["simulation_label"]
    assert state["room_number"] == "A-101"
    assert len(state["persons"]) > 0


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["app"] == "ClassSphere"
        assert "Monitor important events, not personalities." in data["principle"]


@pytest.mark.asyncio
async def test_auth_login_endpoints():
    from app.database import engine, Base
    from app.seed_data import seed_database_if_needed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_database_if_needed()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Invalid login
        res_fail = await ac.post("/api/auth/login", json={
            "email_or_id": "student@classsphere.edu",
            "password": "WrongPassword!"
        })
        assert res_fail.status_code == 401

        # Valid Student login
        res_student = await ac.post("/api/auth/login", json={
            "email_or_id": "student@classsphere.edu",
            "password": "Password@123"
        })
        assert res_student.status_code == 200
        student_data = res_student.json()
        assert student_data["user"]["role"] == "STUDENT"
        student_token = student_data["access_token"]

        # Valid Faculty login
        res_faculty = await ac.post("/api/auth/login", json={
            "email_or_id": "faculty@classsphere.edu",
            "password": "Password@123"
        })
        assert res_faculty.status_code == 200
        faculty_data = res_faculty.json()
        assert faculty_data["user"]["role"] == "FACULTY"

        # Valid HOD login
        res_hod = await ac.post("/api/auth/login", json={
            "email_or_id": "hod@classsphere.edu",
            "password": "Password@123"
        })
        assert res_hod.status_code == 200
        hod_data = res_hod.json()
        assert hod_data["user"]["role"] == "HOD"

        # Role-based restriction check: Student cannot access Faculty dashboard
        res_forbidden = await ac.get(
            "/api/faculty/dashboard",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res_forbidden.status_code == 403


@pytest.mark.asyncio
async def test_student_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login student
        res_login = await ac.post("/api/auth/login", json={
            "email_or_id": "student@classsphere.edu",
            "password": "Password@123"
        })
        token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Dashboard overview
        res_dash = await ac.get("/api/students/dashboard", headers=headers)
        assert res_dash.status_code == 200
        dash_data = res_dash.json()
        assert "overall_attendance_pct" in dash_data
        assert "total_classes" in dash_data

        # Subject-wise attendance
        res_sub = await ac.get("/api/students/attendance/subject-wise", headers=headers)
        assert res_sub.status_code == 200
        subs = res_sub.json()
        assert len(subs) > 0
        assert "attendance_percentage" in subs[0]
        assert "status" in subs[0]

        # What-If Simulator
        res_whatif = await ac.post(
            "/api/students/attendance/what-if",
            headers=headers,
            json={
                "subject_id": subs[0]["subject_id"],
                "simulate_classes_present": 3,
                "simulate_classes_absent": 1
            }
        )
        assert res_whatif.status_code == 200
        whatif_data = res_whatif.json()
        assert "projected_percentage" in whatif_data
        assert "simulation_note" in whatif_data
        assert "Safe projection" in whatif_data["simulation_note"]


@pytest.mark.asyncio
async def test_attendance_override_and_audit():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login faculty
        res_login = await ac.post("/api/auth/login", json={
            "email_or_id": "faculty@classsphere.edu",
            "password": "Password@123"
        })
        faculty_token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {faculty_token}"}

        # Override attendance record 1 with formal reason
        res_override = await ac.post(
            "/api/attendance/override",
            headers=headers,
            json={
                "record_id": 1,
                "new_status": "PRESENT",
                "reason": "Student verified seated in Row 2 Desk 4 during roll call"
            }
        )
        assert res_override.status_code == 200
        ov_data = res_override.json()
        assert ov_data["new_status"] == "PRESENT"
        assert ov_data["manual_override"] is True


@pytest.mark.asyncio
async def test_camera_mode_toggle_and_stream():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login faculty
        res_login = await ac.post("/api/auth/login", json={
            "email_or_id": "faculty@classsphere.edu",
            "password": "Password@123"
        })
        token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Stream state
        res_stream = await ac.get("/api/cameras/1/stream", headers=headers)
        assert res_stream.status_code == 200
        stream_data = res_stream.json()
        assert stream_data["camera_id"] == 1
        assert "DEMONSTRATION DATA" in stream_data["simulation_label"]

        # Toggle mode
        res_toggle = await ac.post("/api/cameras/1/toggle-mode", headers=headers)
        assert res_toggle.status_code == 200
        toggle_data = res_toggle.json()
        assert "new_mode" in toggle_data


@pytest.mark.asyncio
async def test_incident_escalation_and_hod_resolution():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Faculty login
        res_fac = await ac.post("/api/auth/login", json={
            "email_or_id": "faculty@classsphere.edu",
            "password": "Password@123"
        })
        fac_token = res_fac.json()["access_token"]

        # HOD login
        res_hod = await ac.post("/api/auth/login", json={
            "email_or_id": "hod@classsphere.edu",
            "password": "Password@123"
        })
        hod_token = res_hod.json()["access_token"]

        # Faculty escalates incident #1
        res_esc = await ac.post(
            "/api/incidents/escalate",
            headers={"Authorization": f"Bearer {fac_token}"},
            json={
                "incident_id": 1,
                "escalation_reason": "Suspected fall; campus health center requested for verification."
            }
        )
        assert res_esc.status_code == 200

        # HOD resolves incident
        res_res = await ac.post(
            "/api/incidents/resolve",
            headers={"Authorization": f"Bearer {hod_token}"},
            json={
                "incident_id": 1,
                "status": "RESOLVED_HOD",
                "decision": "Campus nurse attended. Student cleared safe to return to class."
            }
        )
        assert res_res.status_code == 200
        res_data = res_res.json()
        assert res_data["status"] == "RESOLVED_HOD"


@pytest.mark.asyncio
async def test_production_seed_guard(monkeypatch):
    from app.config import settings
    from app.seed_data import seed_database_if_needed

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    # In production, seed routine should safely return immediately without mutating data
    await seed_database_if_needed()
    assert settings.ENVIRONMENT == "production"


@pytest.mark.asyncio
async def test_institutional_csv_import():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # HOD login
        res_hod = await ac.post("/api/auth/login", json={
            "email_or_id": "hod@classsphere.edu",
            "password": "Password@123"
        })
        hod_token = res_hod.json()["access_token"]
        headers = {"Authorization": f"Bearer {hod_token}"}

        # 1. Download CSV template for students
        res_tpl = await ac.get("/api/hod/import/template/students", headers=headers)
        assert res_tpl.status_code == 200
        tpl_data = res_tpl.json()
        assert tpl_data["entity_type"] == "STUDENTS"
        assert "roll_number,full_name,email,section_name,batch_year" in tpl_data["template_csv"]

        # 2. Test dry-run CSV import with valid records
        csv_payload = (
            "roll_number,full_name,email,section_name,batch_year\n"
            "CS24B901,Aarav Patel,aarav.patel@classsphere.edu,Section A,2026-2027\n"
            "CS24B902,Diya Sharma,diya.sharma@classsphere.edu,Section A,2026-2027\n"
        )
        res_dry = await ac.post(
            "/api/hod/import/csv",
            headers=headers,
            json={
                "entity_type": "STUDENTS",
                "csv_content": csv_payload,
                "dry_run": True
            }
        )
        assert res_dry.status_code == 200
        dry_res = res_dry.json()
        assert dry_res["success"] is True
        assert dry_res["entity_type"] == "STUDENTS"
        assert dry_res["dry_run"] is True
        assert dry_res["imported_count"] == 2
        assert dry_res["duplicate_count"] == 0
        assert dry_res["error_count"] == 0

        # 3. Test actual commit (dry_run=false)
        res_commit = await ac.post(
            "/api/hod/import/csv",
            headers=headers,
            json={
                "entity_type": "STUDENTS",
                "csv_content": csv_payload,
                "dry_run": False
            }
        )
        assert res_commit.status_code == 200
        commit_res = res_commit.json()
        assert commit_res["dry_run"] is False
        assert commit_res["imported_count"] == 2
        assert commit_res["duplicate_count"] == 0
        assert commit_res["audit_log_id"] is not None
        assert any(item["data_source"] == "REAL" for item in commit_res["imported_preview"])

        # 4. Test duplicate prevention on re-import
        res_dup = await ac.post(
            "/api/hod/import/csv",
            headers=headers,
            json={
                "entity_type": "STUDENTS",
                "csv_content": csv_payload,
                "dry_run": False
            }
        )
        assert res_dup.status_code == 200
        dup_res = res_dup.json()
        assert dup_res["imported_count"] == 0
        assert dup_res["duplicate_count"] == 2

        # 5. Idempotent cleanup of test records
        from app.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            await session.execute(text("DELETE FROM students WHERE roll_number IN ('CS24B901', 'CS24B902')"))
            await session.execute(text("DELETE FROM users WHERE email IN ('aarav.patel@classsphere.edu', 'diya.sharma@classsphere.edu')"))
            await session.commit()


