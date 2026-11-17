import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine, Base
from app.seed_data import seed_database_if_needed


@pytest.mark.asyncio
async def test_timetable_catalogs_and_template():
    # Ensure database is prepared
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_database_if_needed()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login HOD
        res_login = await ac.post("/api/auth/login", json={
            "email_or_id": "hod@classsphere.edu",
            "password": "Password@123"
        })
        assert res_login.status_code == 200
        token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch catalogs
        res_cat = await ac.get("/api/timetable/catalogs", headers=headers)
        assert res_cat.status_code == 200
        cat_data = res_cat.json()
        assert "departments" in cat_data
        assert "sections" in cat_data
        assert "subjects" in cat_data
        assert "faculty" in cat_data
        assert "rooms" in cat_data
        assert len(cat_data["subjects"]) >= 4
        assert len(cat_data["rooms"]) >= 5

        # 2. Fetch template
        res_tmpl = await ac.get("/api/timetable/template", headers=headers)
        assert res_tmpl.status_code == 200
        tmpl_data = res_tmpl.json()
        assert "template_csv" in tmpl_data
        assert "CS301" in tmpl_data["template_csv"]


@pytest.mark.asyncio
async def test_timetable_parsing_and_conflict_detection():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login HOD
        res_login = await ac.post("/api/auth/login", json={
            "email_or_id": "hod@classsphere.edu",
            "password": "Password@123"
        })
        token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Parse CSV with deliberate overlap conflict
        csv_with_conflict = (
            "academic_year,semester,department,section,day,start_time,end_time,subject,faculty,room\n"
            "2026-2027,6,CSE,Section A,Monday,09:30,10:30,CS301,Dr. Ramesh Kulkarni,Hall A-101\n"
            "2026-2027,6,CSE,Section A,Monday,10:00,11:00,CS302,Dr. Ramesh Kulkarni,Hall A-101\n"  # Overlaps from 10:00 to 10:30!
            "2026-2027,6,CSE,Section A,Tuesday,14:00,13:00,CS303,Prof. Dr. Arvind Swaminathan,Lab B-204\n"  # Invalid time range
        )

        res_parse = await ac.post("/api/timetable/parse", data={"csv_text": csv_with_conflict}, headers=headers)
        assert res_parse.status_code == 200
        parse_data = res_parse.json()
        assert parse_data["total_parsed_rows"] == 3
        suggested = parse_data["suggested_mappings"]
        assert "CS301" in suggested["subject_mappings"]

        # Validate with conflicts
        val_payload = {
            "department_id": 1,
            "section_id": 1,
            "academic_year": "2026-2027",
            "semester": 6,
            "raw_entries": parse_data["raw_entries"],
            "mappings": suggested
        }
        res_val = await ac.post("/api/timetable/validate", json=val_payload, headers=headers)
        assert res_val.status_code == 200
        val_data = res_val.json()
        assert val_data["is_valid"] is False
        assert val_data["error_count"] >= 2

        conflict_types = [c["type"] for c in val_data["conflicts"]]
        assert "SECTION_OVERLAP" in conflict_types or "FACULTY_OVERLAP" in conflict_types
        assert "INVALID_TIME_RANGE" in conflict_types


@pytest.mark.asyncio
async def test_timetable_publish_and_schedule_derivation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login HOD
        res_login = await ac.post("/api/auth/login", json={
            "email_or_id": "hod@classsphere.edu",
            "password": "Password@123"
        })
        token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Valid conflict-free timetable
        valid_csv = (
            "academic_year,semester,department,section,day,start_time,end_time,subject,faculty,room\n"
            "2026-2027,6,CSE,Section A,Monday,09:30,10:30,CS301,Dr. Ramesh Kulkarni,Hall A-101\n"
            "2026-2027,6,CSE,Section A,Monday,11:00,12:00,CS302,Dr. Ramesh Kulkarni,Hall A-101\n"
            "2026-2027,6,CSE,Section A,Wednesday,09:30,10:30,CS303,Prof. Dr. Arvind Swaminathan,Hall A-101\n"
            "2026-2027,6,CSE,Section A,Thursday,14:00,15:30,CS304,Dr. Ramesh Kulkarni,Hall C-305\n"
        )

        res_parse = await ac.post("/api/timetable/parse", data={"csv_text": valid_csv}, headers=headers)
        assert res_parse.status_code == 200
        parse_data = res_parse.json()

        # Validate
        val_payload = {
            "department_id": 1,
            "section_id": 1,
            "academic_year": "2026-2027",
            "semester": 6,
            "raw_entries": parse_data["raw_entries"],
            "mappings": parse_data["suggested_mappings"]
        }
        res_val = await ac.post("/api/timetable/validate", json=val_payload, headers=headers)
        assert res_val.status_code == 200
        val_data = res_val.json()
        assert val_data["is_valid"] is True
        assert val_data["error_count"] == 0

        # Publish
        pub_payload = {
            "department_id": 1,
            "section_id": 1,
            "academic_year": "2026-2027",
            "semester": 6,
            "entries": val_data["preview_rows"],
            "notes": "Official 2026-2027 Even Semester Section A Timetable"
        }
        res_pub = await ac.post("/api/timetable/publish", json=pub_payload, headers=headers)
        assert res_pub.status_code == 200
        pub_data = res_pub.json()
        assert pub_data["status"] == "PUBLISHED"
        assert pub_data["total_periods"] == 4
        assert pub_data["derived_sessions_count"] >= 1

        # Check section timetable
        res_sec = await ac.get("/api/timetable/section/1", headers=headers)
        assert res_sec.status_code == 200
        sec_tt = res_sec.json()
        assert len(sec_tt["periods"]) == 4
        assert sec_tt["active_version"] >= 1
        assert len(sec_tt["version_history"]) >= 1

        # Check faculty schedule
        res_fac = await ac.get("/api/timetable/faculty/1", headers=headers)
        assert res_fac.status_code == 200
        fac_tt = res_fac.json()
        assert len(fac_tt) >= 1
