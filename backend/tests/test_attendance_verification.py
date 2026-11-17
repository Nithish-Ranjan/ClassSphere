import io
import pytest
from PIL import Image, ImageDraw
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.cv_services.face_verifier import FaceVerifier, assess_image_quality


def create_test_image_bytes(width=640, height=480, color=(200, 200, 200)):
    img = Image.new("RGB", (width, height), color=color)
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 200, 200], fill=(150, 150, 150))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_face_verifier_image_quality_and_multi_face_matching():
    verifier = FaceVerifier()
    img_bytes = create_test_image_bytes()

    pil_img = Image.open(io.BytesIO(img_bytes))
    quality = assess_image_quality(pil_img)
    assert quality["is_acceptable"] is True
    assert quality["width"] == 640
    assert quality["height"] == 480

    enrolled_students = [
        {"student_id": 1, "name": "Aarav Sharma", "roll_number": "CS24B001", "embedding": [0.1 * i for i in range(16)]},
        {"student_id": 2, "name": "Priya Patel", "roll_number": "CS24B002", "embedding": [0.15 * i for i in range(16)]},
        {"student_id": 3, "name": "Rohan Verma", "roll_number": "CS24B003", "embedding": [0.2 * i for i in range(16)]},
    ]

    result = verifier.process_group_classroom_photo(img_bytes, enrolled_students)
    assert result["total_faces_detected"] >= 3
    assert result["model_version"] == "FaceEmbedNet-v2.1 (Calibrated Cosine Metric)"
    assert len(result["candidate_matches"]) >= 3

    # Check 1-to-1 candidate assignment: each student candidate is assigned at most once
    assigned_student_ids = [c["student_id"] for c in result["candidate_matches"] if c["student_id"] is not None]
    assert len(assigned_student_ids) == len(set(assigned_student_ids))

    for c in result["candidate_matches"]:
        assert "bounding_box" in c
        assert "similarity_score" in c
        assert "status" in c
        assert c["status"] in ["MATCHED_CANDIDATE", "UNCERTAIN", "UNMATCHED", "DUPLICATE_CANDIDATE"]


@pytest.mark.asyncio
async def test_student_selfie_and_candidate_review_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login Faculty and start attendance session for class session 1
        res_fac = await ac.post("/api/auth/login", json={
            "email_or_id": "faculty@classsphere.edu",
            "password": "Password@123"
        })
        fac_token = res_fac.json()["access_token"]
        fac_headers = {"Authorization": f"Bearer {fac_token}"}

        res_att_start = await ac.post("/api/attendance/session/start", json={"class_session_id": 1}, headers=fac_headers)
        assert res_att_start.status_code == 200
        session_id = res_att_start.json()["session_id"]
        challenge = res_att_start.json()["verification_challenge"]

        # 2. Login Student
        res_stu = await ac.post("/api/auth/login", json={
            "email_or_id": "student@classsphere.edu",
            "password": "Password@123"
        })
        stu_token = res_stu.json()["access_token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}

        # Student check-in
        res_checkin = await ac.post("/api/attendance/check-in", json={"challenge_code": challenge}, headers=stu_headers)
        assert res_checkin.status_code in [200, 409]

        # Student selfie photo upload
        test_img = create_test_image_bytes(400, 400)
        files = {"photo": ("selfie.jpg", test_img, "image/jpeg")}
        data = {"session_id": str(session_id)}
        res_selfie = await ac.post("/api/attendance/student/verification-photo", data=data, files=files, headers=stu_headers)
        assert res_selfie.status_code == 200
        selfie_data = res_selfie.json()
        assert "similarity_score" in selfie_data
        assert "status" in selfie_data
        assert selfie_data["similarity_metric"] == "Model Cosine Similarity"

        # 3. Faculty uploads group classroom photo
        group_img = create_test_image_bytes(1280, 720)
        group_files = {"photo": ("classroom_group.jpg", group_img, "image/jpeg")}
        res_group = await ac.post(
            "/api/attendance/upload-photo",
            data={"session_id": str(session_id)},
            files=group_files,
            headers=fac_headers
        )
        assert res_group.status_code == 200
        group_data = res_group.json()
        assert group_data["total_faces_detected"] >= 1
        assert "candidate_matches" in group_data

        # 4. Faculty reviews candidate via review controls
        res_review = await ac.post(
            "/api/attendance/review-candidate",
            headers=fac_headers,
            json={
                "record_id": 1,
                "decision": "CONFIRM_PRESENT",
                "reason": "Visual match confirmed against registered reference."
            }
        )
        assert res_review.status_code == 200
        review_data = res_review.json()
        assert review_data["new_status"] == "PRESENT"
        assert review_data["verification_status"] == "CONFIRMED_BY_REVIEWER"
