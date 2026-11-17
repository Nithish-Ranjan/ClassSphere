import enum
from datetime import datetime, time
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Time, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class DataSourceCategory(str, enum.Enum):
    REAL = "REAL"
    SIMULATED = "SIMULATED"
    TEST = "TEST"
    MODEL_VALIDATION = "MODEL_VALIDATION"


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String(512), nullable=True)

    subjects = relationship("Subject", back_populates="department")
    sections = relationship("Section", back_populates="department")
    students = relationship("Student", back_populates="department")
    faculty_members = relationship("Faculty", back_populates="department")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    credits = Column(Integer, default=3, nullable=False)
    data_source = Column(String(32), default="SIMULATED", nullable=False)

    department = relationship("Department", back_populates="subjects")
    enrollments = relationship("Enrollment", back_populates="subject")
    faculty_assignments = relationship("FacultyAssignment", back_populates="subject")
    timetables = relationship("Timetable", back_populates="subject")
    class_sessions = relationship("ClassSession", back_populates="subject")


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(32), nullable=False)  # e.g., "A", "B", "CSE-1"
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(16), nullable=False)  # e.g., "2026-2027"
    semester = Column(Integer, nullable=False)  # e.g., 6

    department = relationship("Department", back_populates="sections")
    students = relationship("Student", back_populates="section")
    enrollments = relationship("Enrollment", back_populates="section")
    faculty_assignments = relationship("FacultyAssignment", back_populates="section")
    timetables = relationship("Timetable", back_populates="section")
    class_sessions = relationship("ClassSession", back_populates="section")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    roll_number = Column(String(64), unique=True, index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    batch_year = Column(String(16), nullable=False)
    data_source = Column(String(32), default="SIMULATED", nullable=False)

    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    section = relationship("Section", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student")
    identity_references = relationship("IdentityReference", back_populates="student", cascade="all, delete-orphan")
    activity_events = relationship("ActivityEvent", back_populates="student")


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_id = Column(String(64), unique=True, index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    designation = Column(String(128), nullable=False)  # e.g., "Associate Professor", "Head of Department"
    data_source = Column(String(32), default="SIMULATED", nullable=False)

    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty_members")
    assignments = relationship("FacultyAssignment", back_populates="faculty", cascade="all, delete-orphan")
    timetables = relationship("Timetable", back_populates="faculty")
    class_sessions = relationship("ClassSession", back_populates="faculty")


class FacultyAssignment(Base):
    __tablename__ = "faculty_assignments"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    academic_term = Column(String(32), nullable=False)

    faculty = relationship("Faculty", back_populates="assignments")
    subject = relationship("Subject", back_populates="faculty_assignments")
    section = relationship("Section", back_populates="faculty_assignments")

    __table_args__ = (
        UniqueConstraint("faculty_id", "subject_id", "section_id", "academic_term", name="uq_faculty_assignment"),
    )


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    enrollment_status = Column(String(32), default="ACTIVE", nullable=False)

    student = relationship("Student", back_populates="enrollments")
    subject = relationship("Subject", back_populates="enrollments")
    section = relationship("Section", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", name="uq_student_subject_enrollment"),
    )


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(64), unique=True, nullable=False)
    building = Column(String(64), default="Main Academic Block", nullable=False)
    capacity = Column(Integer, default=60, nullable=False)
    room_type = Column(String(32), default="LECTURE_HALL", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class TimetableSet(Base):
    __tablename__ = "timetable_sets"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(16), nullable=False)  # e.g., "2026-2027"
    semester = Column(Integer, nullable=False)  # e.g., 6
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, default=1, nullable=False)
    status = Column(String(32), default="DRAFT", nullable=False)  # DRAFT, VALIDATED, PUBLISHED, ARCHIVED
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    published_at = Column(DateTime, nullable=True)
    notes = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    department = relationship("Department")
    section = relationship("Section")
    created_by = relationship("User")
    entries = relationship("Timetable", back_populates="timetable_set", cascade="all, delete-orphan")


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    timetable_set_id = Column(Integer, ForeignKey("timetable_sets.id", ondelete="CASCADE"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0 = Monday, 6 = Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room_number = Column(String(64), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    timetable_set = relationship("TimetableSet", back_populates="entries")
    subject = relationship("Subject", back_populates="timetables")
    section = relationship("Section", back_populates="timetables")
    faculty = relationship("Faculty", back_populates="timetables")
    class_sessions = relationship("ClassSession", back_populates="timetable")
