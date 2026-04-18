"""
MedVault AI - Database Models (SQLite + SQLAlchemy)
India-centric medical identity system.
All data stored locally with SQLite - 100% free.
"""

from sqlalchemy import (
    create_engine, Column, Integer, String, Text, DateTime, Boolean,
    ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime, timezone
import enum

DATABASE_URL = "sqlite:///./medvault.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    LAB = "lab"
    EMERGENCY = "emergency"


class RecordType(str, enum.Enum):
    LAB_REPORT = "lab_report"
    PRESCRIPTION = "prescription"
    DISCHARGE_SUMMARY = "discharge_summary"
    IMAGING = "imaging"
    VACCINATION = "vaccination"
    OTHER = "other"


class AlertLevel(str, enum.Enum):
    NORMAL = "normal"
    AMBER = "amber"
    RED = "red"


# ─── User Model ──────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    # Universal Medical ID: SHA-256 hash of Aadhaar number
    medical_id = Column(String(64), unique=True, index=True, nullable=False)
    full_name = Column(String(200), nullable=False)
    date_of_birth = Column(String(10))  # DD-MM-YYYY format (Indian standard)
    gender = Column(String(20))
    phone = Column(String(15))  # Indian mobile: +91XXXXXXXXXX
    email = Column(String(200))
    role = Column(SAEnum(UserRole), default=UserRole.PATIENT)
    password_hash = Column(String(255), nullable=False)

    # Emergency-critical fields (displayed on QR scan)
    blood_group = Column(String(10))  # A+, B-, O+, AB+, etc.
    allergies = Column(Text)  # Comma-separated: "Penicillin, Sulfa drugs"
    chronic_conditions = Column(Text)  # "Diabetes Type 2, Hypertension"
    current_medications = Column(Text)  # "Metformin 500mg, Amlodipine 5mg"
    emergency_contact_name = Column(String(200))
    emergency_contact_phone = Column(String(15))

    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)

    # Relationships
    records = relationship("MedicalRecord", back_populates="patient",
                           foreign_keys="MedicalRecord.patient_id")
    audit_logs = relationship("AuditLog", back_populates="patient",
                              foreign_keys="AuditLog.patient_id")


# ─── Medical Record Model ────────────────────────────────────────────────────

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"))  # Lab/Doctor who uploaded
    record_type = Column(SAEnum(RecordType), default=RecordType.OTHER)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    file_path = Column(String(500))  # Path to stored PDF/image
    ocr_text = Column(Text)  # Extracted text from OCR
    ai_summary = Column(Text)  # AI-generated clinical bullet points
    alert_level = Column(SAEnum(AlertLevel), default=AlertLevel.NORMAL)
    alert_reason = Column(Text)  # Why flagged amber/red

    # Lab-specific metadata
    lab_name = Column(String(300))
    lab_license = Column(String(100))  # Indian lab registration number
    report_date = Column(DateTime)

    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_verified = Column(Boolean, default=False)

    # Relationships
    patient = relationship("User", back_populates="records",
                           foreign_keys=[patient_id])


# ─── Audit Log (Break-Glass Trail) ───────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    accessed_by = Column(String(200))  # Who accessed (name/role/device)
    access_type = Column(String(50))   # "emergency_qr_scan", "doctor_view", etc.
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    data_accessed = Column(Text)  # What fields were viewed
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    patient = relationship("User", back_populates="audit_logs",
                           foreign_keys=[patient_id])


# ─── Voice AI Session Log ────────────────────────────────────────────────────

class VoiceSession(Base):
    __tablename__ = "voice_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    language = Column(String(20), default="hi")  # hi, ta, te, bn, mr, en
    query = Column(Text)
    response = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Initialize Database ─────────────────────────────────────────────────────

def init_db():
    """Create all tables in SQLite database."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
