import json
import logging
from datetime import datetime, time, timedelta
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.user import User, RoleEnum, AuditLog
from app.models.academic import (
    Department, Subject, Section, Student, Faculty,
    FacultyAssignment, Enrollment, Timetable
)
from app.models.session import ClassSession, ClassLog, SessionStatus, OperatingMode
from app.models.attendance import (
    AttendanceSession, AttendanceRecord, AttendanceAttempt,
    IdentityReference, AttendanceStatus, AttendanceSessionStatus
)
from app.models.camera import Camera, CameraSession, CameraMode, CameraStatus, StreamHealth
from app.models.event import (
    ActivityEvent, IncidentRecord, ModelVersion,
    EventType, EventReviewStatus, IncidentType, IncidentStatus
)
from app.models.notification import Notification, NotificationCategory, DeliveryStatus
from app.core.security import hash_password
from app.config import settings

logger = logging.getLogger("classsphere.seed")


async def seed_database_if_needed():
    # Production Data Restriction: seeded development data must never enter production environment
    if settings.ENVIRONMENT.lower() == "production":
        logger.warning(
            "Production environment detected (ENVIRONMENT=production). "
            "Refusing to execute synthetic seed routine. "
            "Institutional records must be provisioned via authorized CSV import or institutional API."
        )
        return

    async with AsyncSessionLocal() as db:
        # Check if users table has records
        user_check = await db.execute(select(User).limit(1))
        if user_check.scalar_one_or_none() is not None:
            logger.info("Database already seeded. Skipping initial seeding.")
            return

        logger.info("Seeding initial realistic academic data for ClassSphere 2.0...")

        # 1. Department
        dept = Department(
            code="CSE",
            name="Computer Science & Engineering",
            description="School of Computing & Artificial Intelligence"
        )
        db.add(dept)
        await db.flush()

        # 2. Section
        section_a = Section(
            name="Section A",
            department_id=dept.id,
            academic_year="2026-2027",
            semester=6
        )
        db.add(section_a)
        await db.flush()

        # 3. Subjects
        sub_cv = Subject(code="CS301", name="Deep Learning & Computer Vision", department_id=dept.id, credits=4)
        sub_db = Subject(code="CS302", name="Distributed Database Systems", department_id=dept.id, credits=3)
        sub_os = Subject(code="CS303", name="Operating Systems & Concurrency", department_id=dept.id, credits=4)
        sub_cn = Subject(code="CS304", name="Computer Networks & Protocols", department_id=dept.id, credits=3)
        db.add_all([sub_cv, sub_db, sub_os, sub_cn])
        await db.flush()

        # 4. Users & Profiles
        # Default secure password for demo accounts: Password@123
        hashed_pwd = hash_password("Password@123")

        # HOD
        hod_user = User(
            email="hod@classsphere.edu",
            institutional_id="HOD-001",
            hashed_password=hashed_pwd,
            full_name="Prof. Dr. Arvind Swaminathan",
            phone_number="+919876543201",
            role=RoleEnum.HOD,
            is_active=True,
            is_phone_verified=True,
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
        )
        db.add(hod_user)
        await db.flush()

        hod_faculty = Faculty(
            user_id=hod_user.id,
            employee_id="EMP-HOD-01",
            department_id=dept.id,
            designation="Head of Department & Professor"
        )
        db.add(hod_faculty)

        # Faculty
        faculty_user = User(
            email="faculty@classsphere.edu",
            institutional_id="FAC-1001",
            hashed_password=hashed_pwd,
            full_name="Dr. Ramesh Kulkarni",
            phone_number="+919876543202",
            role=RoleEnum.FACULTY,
            is_active=True,
            is_phone_verified=True,
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
        )
        db.add(faculty_user)
        await db.flush()

        faculty_profile = Faculty(
            user_id=faculty_user.id,
            employee_id="EMP-FAC-01",
            department_id=dept.id,
            designation="Associate Professor"
        )
        db.add(faculty_profile)
        await db.flush()

        # Faculty Assignments
        assign1 = FacultyAssignment(faculty_id=faculty_profile.id, subject_id=sub_cv.id, section_id=section_a.id, academic_term="Spring 2026")
        assign2 = FacultyAssignment(faculty_id=faculty_profile.id, subject_id=sub_db.id, section_id=section_a.id, academic_term="Spring 2026")
        db.add_all([assign1, assign2])

        # Primary Student
        student_user = User(
            email="student@classsphere.edu",
            institutional_id="STU-2024-001",
            hashed_password=hashed_pwd,
            full_name="Aarav Sharma",
            phone_number="+919876543203",
            role=RoleEnum.STUDENT,
            is_active=True,
            is_phone_verified=True,
            avatar_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80"
        )
        db.add(student_user)
        await db.flush()

        student_profile = Student(
            user_id=student_user.id,
            roll_number="CS24B001",
            department_id=dept.id,
            section_id=section_a.id,
            batch_year="2024-2028"
        )
        db.add(student_profile)
        await db.flush()

        # Additional Students
        student_roster_data = [
            ("Priya Patel", "STU-2024-002", "CS24B002", "priya.patel@classsphere.edu"),
            ("Rohan Verma", "STU-2024-003", "CS24B003", "rohan.verma@classsphere.edu"),
            ("Ananya Iyer", "STU-2024-004", "CS24B004", "ananya.iyer@classsphere.edu"),
            ("Vikram Malhotra", "STU-2024-005", "CS24B005", "vikram.malhotra@classsphere.edu"),
            ("Neha Reddy", "STU-2024-006", "CS24B006", "neha.reddy@classsphere.edu"),
            ("Siddharth Nair", "STU-2024-007", "CS24B007", "siddharth.nair@classsphere.edu"),
            ("Pooja Joshi", "STU-2024-008", "CS24B008", "pooja.joshi@classsphere.edu"),
        ]

        all_students = [student_profile]
        for name, inst_id, roll, email in student_roster_data:
            u = User(
                email=email,
                institutional_id=inst_id,
                hashed_password=hashed_pwd,
                full_name=name,
                role=RoleEnum.STUDENT,
                is_active=True,
                is_phone_verified=True
            )
            db.add(u)
            await db.flush()

            st = Student(
                user_id=u.id,
                roll_number=roll,
                department_id=dept.id,
                section_id=section_a.id,
                batch_year="2024-2028"
            )
            db.add(st)
            await db.flush()
            all_students.append(st)

        # Enroll all students in the 4 subjects
        for s in all_students:
            for subj in [sub_cv, sub_db, sub_os, sub_cn]:
                enr = Enrollment(student_id=s.id, subject_id=subj.id, section_id=section_a.id)
                db.add(enr)

            # Add enrolled identity reference (consented reference embedding)
            ref_emb = [round((i * 0.05 + (s.id % 5) * 0.1), 3) for i in range(16)]
            ref = IdentityReference(
                student_id=s.id,
                reference_photo_url=f"/uploads/references/student_{s.id}.jpg",
                embedding_vector=json.dumps(ref_emb),
                quality_score=0.98,
                is_active=True
            )
            db.add(ref)

        # 5. Timetable entries
        tt1 = Timetable(
            subject_id=sub_cv.id, section_id=section_a.id, faculty_id=faculty_profile.id,
            day_of_week=0, start_time=time(9, 30), end_time=time(10, 30), room_number="Hall A-101"
        )
        tt2 = Timetable(
            subject_id=sub_db.id, section_id=section_a.id, faculty_id=faculty_profile.id,
            day_of_week=0, start_time=time(11, 00), end_time=time(12, 00), room_number="Hall A-101"
        )
        db.add_all([tt1, tt2])
        await db.flush()

        # 6. Cameras
        cam1 = Camera(
            name="Hall A-101 Main Camera",
            room_number="Hall A-101",
            ip_or_rtsp_url="simulated://classroom_a101",
            mode=CameraMode.SIMULATION,
            status=CameraStatus.ONLINE,
            stream_health=StreamHealth.HEALTHY,
            fps=24.0,
            resolution="1920x1080"
        )
        cam2 = Camera(
            name="Lab B-204 Workstation Feed",
            room_number="Lab B-204",
            ip_or_rtsp_url="simulated://classroom_b204",
            mode=CameraMode.SIMULATION,
            status=CameraStatus.ONLINE,
            stream_health=StreamHealth.HEALTHY,
            fps=24.0,
            resolution="1920x1080"
        )
        cam3 = Camera(
            name="Hall C-305 CCTV Source",
            room_number="Hall C-305",
            ip_or_rtsp_url="rtsp://192.168.1.135:554/live/ch0",
            mode=CameraMode.CONNECTED,
            status=CameraStatus.ONLINE,
            stream_health=StreamHealth.HEALTHY,
            fps=30.0,
            resolution="1920x1080"
        )
        db.add_all([cam1, cam2, cam3])
        await db.flush()

        # 7. ClassSessions
        now = datetime.utcnow()
        today_date = now.date()

        # Completed session earlier today
        session_past = ClassSession(
            timetable_id=tt2.id,
            subject_id=sub_db.id,
            section_id=section_a.id,
            faculty_id=faculty_profile.id,
            room_number="Hall A-101",
            scheduled_start=datetime.combine(today_date, time(9, 30)),
            scheduled_end=datetime.combine(today_date, time(10, 30)),
            actual_start=datetime.combine(today_date, time(9, 32)),
            actual_end=datetime.combine(today_date, time(10, 28)),
            status=SessionStatus.COMPLETED,
            mode=OperatingMode.SIMULATION,
            topic="Distributed Consensus & Paxos Architecture"
        )
        db.add(session_past)
        await db.flush()

        # Finalized attendance for past session
        past_att = AttendanceSession(
            class_session_id=session_past.id,
            verification_challenge="PXZ821",
            created_by_faculty_id=faculty_profile.id,
            status=AttendanceSessionStatus.FINALIZED,
            started_at=session_past.actual_start,
            closed_at=session_past.actual_end,
            classroom_photo_url="/uploads/classroom_photos/session_past.jpg",
            detected_faces_count=len(all_students),
            verified_matches_count=len(all_students) - 1,
            pending_reviews_count=0
        )
        db.add(past_att)
        await db.flush()

        for idx, s in enumerate(all_students):
            status_val = AttendanceStatus.PRESENT if idx != 3 else AttendanceStatus.ABSENT
            rec = AttendanceRecord(
                attendance_session_id=past_att.id,
                class_session_id=session_past.id,
                student_id=s.id,
                status=status_val,
                confidence_score=0.92 if status_val == AttendanceStatus.PRESENT else 0.0,
                verified_by_photo=True if status_val == AttendanceStatus.PRESENT else False,
                marked_at=session_past.actual_start + timedelta(minutes=5)
            )
            db.add(rec)

        # Active session right now
        session_active = ClassSession(
            timetable_id=tt1.id,
            subject_id=sub_cv.id,
            section_id=section_a.id,
            faculty_id=faculty_profile.id,
            room_number="Hall A-101",
            scheduled_start=datetime.combine(today_date, time(11, 00)),
            scheduled_end=datetime.combine(today_date, time(12, 30)),
            actual_start=datetime.combine(today_date, time(11, 2)),
            status=SessionStatus.ACTIVE,
            mode=OperatingMode.SIMULATION,
            topic="Convolutional Neural Networks & YOLO Object Detection"
        )
        db.add(session_active)
        await db.flush()

        # Active attendance session with verification challenge
        active_att = AttendanceSession(
            class_session_id=session_active.id,
            verification_challenge="CS8492",
            created_by_faculty_id=faculty_profile.id,
            status=AttendanceSessionStatus.ACTIVE,
            started_at=session_active.actual_start,
            classroom_photo_url="/uploads/classroom_photos/session_active_demo.jpg",
            detected_faces_count=len(all_students),
            verified_matches_count=6,
            pending_reviews_count=2
        )
        db.add(active_att)
        await db.flush()

        # Pre-seed records for active session
        for idx, s in enumerate(all_students):
            st_status = AttendanceStatus.PRESENT
            conf = 0.94
            photo_ver = True
            if idx == 1:
                st_status = AttendanceStatus.MANUAL_REVIEW
                conf = 0.68  # uncertain match -> review queue
                photo_ver = False
            elif idx == 4:
                st_status = AttendanceStatus.LATE
                conf = 0.88
                photo_ver = True
            elif idx == 7:
                st_status = AttendanceStatus.PENDING_VERIFICATION
                conf = None
                photo_ver = False

            rec = AttendanceRecord(
                attendance_session_id=active_att.id,
                class_session_id=session_active.id,
                student_id=s.id,
                status=st_status,
                confidence_score=conf,
                verified_by_photo=photo_ver,
                marked_at=session_active.actual_start + timedelta(minutes=8)
            )
            db.add(rec)

        # 8. ClassLogs
        db.add(ClassLog(
            class_session_id=session_active.id,
            event_type="CLASS_STARTED",
            description="Class session initiated by Dr. Ramesh Kulkarni.",
            source="FACULTY",
            timestamp=session_active.actual_start
        ))
        db.add(ClassLog(
            class_session_id=session_active.id,
            event_type="CAMERA_CONNECTED",
            description="Hall A-101 camera feed connected [SIMULATION MODE].",
            source="CAMERA",
            timestamp=session_active.actual_start + timedelta(seconds=15)
        ))
        db.add(ClassLog(
            class_session_id=session_active.id,
            event_type="ATTENDANCE_STARTED",
            description="Attendance session started with Challenge Code: CS8492.",
            source="FACULTY",
            timestamp=session_active.actual_start + timedelta(minutes=3)
        ))
        db.add(ClassLog(
            class_session_id=session_active.id,
            event_type="PHOTO_VERIFIED",
            description="Classroom photo processed. 8 candidates evaluated, 2 queued for manual review.",
            source="VERIFICATION",
            timestamp=session_active.actual_start + timedelta(minutes=8)
        ))

        # 9. Activity Events (Events only. No scores. No labels.)
        ev1 = ActivityEvent(
            class_session_id=session_active.id,
            camera_id=cam1.id,
            student_id=student_profile.id,
            event_type=EventType.PHONE_USAGE,
            confidence=0.88,
            timestamp=session_active.actual_start + timedelta(minutes=14),
            model_version="yolo-activity-v1.0",
            review_status=EventReviewStatus.UNREVIEWED,
            is_simulated=1
        )
        ev2 = ActivityEvent(
            class_session_id=session_active.id,
            camera_id=cam1.id,
            student_id=all_students[2].id,
            event_type=EventType.TALKING,
            confidence=0.74,
            timestamp=session_active.actual_start + timedelta(minutes=18),
            model_version="talking-flow-v1.0",
            review_status=EventReviewStatus.UNREVIEWED,
            is_simulated=1
        )
        ev3 = ActivityEvent(
            class_session_id=session_active.id,
            camera_id=cam1.id,
            student_id=all_students[5].id,
            event_type=EventType.PHONE_USAGE,
            confidence=0.91,
            timestamp=session_active.actual_start + timedelta(minutes=22),
            model_version="yolo-activity-v1.0",
            review_status=EventReviewStatus.VERIFIED,
            is_simulated=1
        )
        db.add_all([ev1, ev2, ev3])

        # 10. Safety Incident Record (PRD FR-13)
        incident_sample = IncidentRecord(
            class_session_id=session_active.id,
            camera_id=cam1.id,
            incident_type=IncidentType.SUDDEN_FALL,
            confidence=0.89,
            timestamp=session_active.actual_start + timedelta(minutes=25),
            evidence_snapshot_url="/uploads/classroom_photos/incident_fall_sim.jpg",
            status=IncidentStatus.PENDING_FACULTY_REVIEW,
            is_simulated=1
        )
        db.add(incident_sample)

        # 11. Model Versions (PRD FR-13/17: Accuracy, Recall, Limitations)
        mv1 = ModelVersion(
            model_name="YOLOv8-Classroom-Person",
            task_type="PERSON_DETECTION",
            version="v8.1.0",
            source="Ultralytics / Custom Finetuned",
            dataset="ClassroomSeated-4k",
            precision=0.942,
            recall=0.918,
            f1_score=0.930,
            false_positive_rate=0.038,
            false_negative_rate=0.082,
            processing_time_ms=18.5,
            limitations="Occlusions behind computer monitors or tall lecterns can lower recall."
        )
        mv2 = ModelVersion(
            model_name="FaceNet-ArcFace-Identity",
            task_type="FACE_VERIFICATION",
            version="v2.3.1",
            source="InsightFace ArcFace R50",
            dataset="LFW / Institutional-Consent-HeldOut",
            precision=0.985,
            recall=0.962,
            f1_score=0.973,
            false_positive_rate=0.008,
            false_negative_rate=0.038,
            processing_time_ms=32.0,
            limitations="Severe side angles (>45 degrees) and extreme dimming require human review."
        )
        mv3 = ModelVersion(
            model_name="PhoneAction-Detector",
            task_type="PHONE_DETECTION",
            version="v1.2.0",
            source="YOLOv8-Small-Phone",
            dataset="ClassroomDevice-2.5k",
            precision=0.875,
            recall=0.830,
            f1_score=0.852,
            false_positive_rate=0.085,
            false_negative_rate=0.170,
            processing_time_ms=21.0,
            limitations="Black notebook covers or small calculators can occasionally trigger false positives."
        )
        mv4 = ModelVersion(
            model_name="MouthOpticalFlow-Estimator",
            task_type="TALKING_ESTIMATION",
            version="v1.0.0",
            source="OpenCV OpticalFlow + MediaPipe Mesh",
            dataset="SilentVideo-Benchmark-1.2k",
            precision=0.760,
            recall=0.720,
            f1_score=0.739,
            false_positive_rate=0.190,
            false_negative_rate=0.280,
            processing_time_ms=24.0,
            limitations="Estimate only. Silent video cannot prove whether audible speech occurred."
        )
        mv5 = ModelVersion(
            model_name="CentroidAspect-FallDetector",
            task_type="FALL_DETECTION",
            version="v1.1.0",
            source="PoseAnomaly-CentroidDrop",
            dataset="UR Fall Detection Dataset + Simulated Desks",
            precision=0.910,
            recall=0.940,
            f1_score=0.925,
            false_positive_rate=0.065,
            false_negative_rate=0.060,
            processing_time_ms=16.0,
            limitations="Bending down to pick up a dropped pencil can trigger a candidate alert for verification."
        )
        db.add_all([mv1, mv2, mv3, mv4, mv5])

        # 12. Notifications
        n1 = Notification(
            recipient_user_id=student_user.id,
            role_target="STUDENT",
            title="Class Active: Deep Learning",
            message="Prof. Kulkarni has initiated attendance verification for CS301 in Hall A-101. Check in now.",
            category=NotificationCategory.ATTENDANCE,
            is_read=False,
            delivery_status=DeliveryStatus.DELIVERED,
            link_url="/student/companion"
        )
        n2 = Notification(
            recipient_user_id=faculty_user.id,
            role_target="FACULTY",
            title="Potential Safety Alert Detected",
            message="Sudden posture anomaly detected in Hall A-101. Please inspect and acknowledge.",
            category=NotificationCategory.INCIDENT,
            is_read=False,
            delivery_status=DeliveryStatus.DELIVERED,
            link_url="/faculty/safety"
        )
        n3 = Notification(
            recipient_user_id=hod_user.id,
            role_target="HOD",
            title="Daily Attendance Report Ready",
            message="CSE Department semester 6 overall attendance currently stands at 88.5%.",
            category=NotificationCategory.ACADEMIC,
            is_read=False,
            delivery_status=DeliveryStatus.DELIVERED,
            link_url="/hod/dashboard"
        )
        db.add_all([n1, n2, n3])

        # 13. Audit Log
        audit_init = AuditLog(
            user_id=hod_user.id,
            action="SYSTEM_INITIALIZATION",
            resource="DATABASE",
            details="ClassSphere 2.0 academic database seeded with realistic institutional data."
        )
        db.add(audit_init)

        await db.commit()
        logger.info("ClassSphere 2.0 database seeded successfully!")
