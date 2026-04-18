"""
MedVault AI - FastAPI Main Application
Central API serving all four role-based interfaces.
India-centric medical identity ecosystem.
"""

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional
import os

from models import (
    init_db, get_db, User, MedicalRecord, AuditLog, VoiceSession,
    UserRole, RecordType, AlertLevel
)
from auth import (
    generate_medical_id, hash_password, verify_password,
    create_access_token, get_current_user, require_role
)
from ai_engine import summarize_report, generate_voice_summary
from ocr_processor import process_upload, save_uploaded_file

# ─── App Init ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="MedVault AI",
    description="India's Centralized Medical Identity Ecosystem — Golden Hour Ready",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    # Seed a demo patient for hackathon
    db = next(get_db())
    if not db.query(User).first():
        demo = User(
            medical_id=generate_medical_id("123456789012"),
            full_name="Rajesh Kumar",
            date_of_birth="15-08-1985",
            gender="Male",
            phone="+919876543210",
            email="rajesh.kumar@example.com",
            role=UserRole.PATIENT,
            password_hash=hash_password("demo123"),
            blood_group="B+",
            allergies="Penicillin, Sulfa drugs",
            chronic_conditions="Diabetes Type 2, Hypertension",
            current_medications="Metformin 500mg, Amlodipine 5mg",
            emergency_contact_name="Priya Kumar",
            emergency_contact_phone="+919876543211",
        )
        doctor = User(
            medical_id=generate_medical_id("987654321098"),
            full_name="Dr. Anita Sharma",
            date_of_birth="22-03-1978",
            gender="Female",
            phone="+919123456789",
            role=UserRole.DOCTOR,
            password_hash=hash_password("doctor123"),
            blood_group="O+",
        )
        lab = User(
            medical_id=generate_medical_id("111222333444"),
            full_name="PathCare Diagnostics",
            phone="+911234567890",
            role=UserRole.LAB,
            password_hash=hash_password("lab123"),
        )
        db.add_all([demo, doctor, lab])
        db.commit()
    db.close()


# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    aadhaar_number: str = Field(..., min_length=12, max_length=14)
    full_name: str
    password: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = "patient"


class LoginRequest(BaseModel):
    aadhaar_number: str
    password: str


class UpdateProfileRequest(BaseModel):
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class VoiceQueryRequest(BaseModel):
    language: str = "hi"


# ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

@app.post("/api/auth/register", tags=["Auth"])
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with Aadhaar-based Medical ID."""
    medical_id = generate_medical_id(req.aadhaar_number)

    if db.query(User).filter(User.medical_id == medical_id).first():
        raise HTTPException(status_code=400, detail="User already registered")

    role_map = {
        "patient": UserRole.PATIENT,
        "doctor": UserRole.DOCTOR,
        "lab": UserRole.LAB,
        "emergency": UserRole.EMERGENCY,
    }

    user = User(
        medical_id=medical_id,
        full_name=req.full_name,
        password_hash=hash_password(req.password),
        date_of_birth=req.date_of_birth,
        gender=req.gender,
        phone=req.phone,
        email=req.email,
        role=role_map.get(req.role, UserRole.PATIENT),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": medical_id, "role": user.role.value})
    return {
        "medical_id": medical_id,
        "token": token,
        "role": user.role.value,
        "name": user.full_name,
    }


@app.post("/api/auth/login", tags=["Auth"])
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login with Aadhaar number + password."""
    medical_id = generate_medical_id(req.aadhaar_number)
    user = db.query(User).filter(User.medical_id == medical_id).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": medical_id, "role": user.role.value})
    return {
        "medical_id": medical_id,
        "token": token,
        "role": user.role.value,
        "name": user.full_name,
    }


# ─── PATIENT PORTAL ROUTES ──────────────────────────────────────────────────

@app.get("/api/patient/profile", tags=["Patient"])
def get_profile(current_user: User = Depends(get_current_user)):
    """Get current patient's full profile."""
    return {
        "medical_id": current_user.medical_id,
        "full_name": current_user.full_name,
        "date_of_birth": current_user.date_of_birth,
        "gender": current_user.gender,
        "phone": current_user.phone,
        "email": current_user.email,
        "blood_group": current_user.blood_group,
        "allergies": current_user.allergies,
        "chronic_conditions": current_user.chronic_conditions,
        "current_medications": current_user.current_medications,
        "emergency_contact_name": current_user.emergency_contact_name,
        "emergency_contact_phone": current_user.emergency_contact_phone,
        "role": current_user.role.value,
    }


@app.put("/api/patient/profile", tags=["Patient"])
def update_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update patient's medical profile and emergency info."""
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    return {"message": "Profile updated successfully"}


@app.get("/api/patient/records", tags=["Patient"])
def get_my_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all medical records for the current patient."""
    records = db.query(MedicalRecord).filter(
        MedicalRecord.patient_id == current_user.id
    ).order_by(MedicalRecord.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "title": r.title,
            "record_type": r.record_type.value if r.record_type else None,
            "description": r.description,
            "ai_summary": r.ai_summary,
            "alert_level": r.alert_level.value if r.alert_level else "normal",
            "alert_reason": r.alert_reason,
            "lab_name": r.lab_name,
            "report_date": r.report_date.isoformat() if r.report_date else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "is_verified": r.is_verified,
        }
        for r in records
    ]


@app.get("/api/patient/audit-log", tags=["Patient"])
def get_audit_log(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """View who accessed your medical data (Break-Glass trail)."""
    logs = db.query(AuditLog).filter(
        AuditLog.patient_id == current_user.id
    ).order_by(AuditLog.timestamp.desc()).all()

    return [
        {
            "accessed_by": log.accessed_by,
            "access_type": log.access_type,
            "data_accessed": log.data_accessed,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "ip_address": log.ip_address,
        }
        for log in logs
    ]


# ─── DOCTOR DASHBOARD ROUTES ────────────────────────────────────────────────

@app.get("/api/doctor/search/{medical_id}", tags=["Doctor"])
def doctor_search_patient(
    medical_id: str,
    current_user: User = Depends(require_role(UserRole.DOCTOR)),
    db: Session = Depends(get_db)
):
    """Doctor searches for a patient by their Universal Medical ID."""
    patient = db.query(User).filter(User.medical_id == medical_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Log the access
    audit = AuditLog(
        patient_id=patient.id,
        accessed_by=f"Dr. {current_user.full_name}",
        access_type="doctor_view",
        data_accessed="Full clinical profile",
    )
    db.add(audit)
    db.commit()

    records = db.query(MedicalRecord).filter(
        MedicalRecord.patient_id == patient.id
    ).order_by(MedicalRecord.created_at.desc()).all()

    return {
        "patient": {
            "medical_id": patient.medical_id,
            "full_name": patient.full_name,
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "blood_group": patient.blood_group,
            "allergies": patient.allergies,
            "chronic_conditions": patient.chronic_conditions,
            "current_medications": patient.current_medications,
        },
        "records": [
            {
                "id": r.id,
                "title": r.title,
                "record_type": r.record_type.value if r.record_type else None,
                "ai_summary": r.ai_summary,
                "alert_level": r.alert_level.value if r.alert_level else "normal",
                "alert_reason": r.alert_reason,
                "report_date": r.report_date.isoformat() if r.report_date else None,
            }
            for r in records
        ],
        "alerts": [
            r for r in records
            if r.alert_level in [AlertLevel.AMBER, AlertLevel.RED]
        ],
    }


# ─── EMERGENCY RESPONDER ROUTES ─────────────────────────────────────────────

@app.get("/api/emergency/{medical_id}", tags=["Emergency"])
def emergency_access(
    medical_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Emergency QR scan endpoint — NO AUTH REQUIRED.
    Returns ONLY life-critical data. Logs the access for audit.
    """
    patient = db.query(User).filter(User.medical_id == medical_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Medical ID not found")

    # Break-Glass Audit Trail
    audit = AuditLog(
        patient_id=patient.id,
        accessed_by="Emergency Responder (QR Scan)",
        access_type="emergency_qr_scan",
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent", "unknown"),
        data_accessed="Emergency profile: blood group, allergies, conditions, medications, emergency contact",
    )
    db.add(audit)
    db.commit()

    return {
        "status": "EMERGENCY ACCESS GRANTED",
        "patient_name": patient.full_name,
        "blood_group": patient.blood_group,
        "allergies": patient.allergies,
        "chronic_conditions": patient.chronic_conditions,
        "current_medications": patient.current_medications,
        "emergency_contact": {
            "name": patient.emergency_contact_name,
            "phone": patient.emergency_contact_phone,
        },
        "disclaimer": "This data was accessed via emergency protocol. Access has been logged.",
    }


# ─── LAB INTERFACE ROUTES ───────────────────────────────────────────────────

@app.post("/api/lab/upload/{patient_medical_id}", tags=["Lab"])
async def lab_upload_report(
    patient_medical_id: str,
    file: UploadFile = File(...),
    title: str = "Lab Report",
    record_type: str = "lab_report",
    current_user: User = Depends(require_role(UserRole.LAB, UserRole.DOCTOR)),
    db: Session = Depends(get_db)
):
    """Lab uploads a diagnostic report for a patient. AI auto-summarizes and flags alerts."""
    patient = db.query(User).filter(User.medical_id == patient_medical_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Save the file
    content = await file.read()
    file_path = save_uploaded_file(file.filename or "report", content)

    # OCR extract
    ocr_text = process_upload(file_path)

    # AI summarize + flag
    ai_result = summarize_report(ocr_text)

    type_map = {
        "lab_report": RecordType.LAB_REPORT,
        "prescription": RecordType.PRESCRIPTION,
        "discharge_summary": RecordType.DISCHARGE_SUMMARY,
        "imaging": RecordType.IMAGING,
        "vaccination": RecordType.VACCINATION,
    }

    record = MedicalRecord(
        patient_id=patient.id,
        uploaded_by=current_user.id,
        record_type=type_map.get(record_type, RecordType.OTHER),
        title=title,
        file_path=file_path,
        ocr_text=ocr_text,
        ai_summary=ai_result["summary"],
        alert_level=AlertLevel.RED if ai_result["alert_level"] == "red"
                    else AlertLevel.AMBER if ai_result["alert_level"] == "amber"
                    else AlertLevel.NORMAL,
        alert_reason=ai_result["alert_reason"],
        lab_name=current_user.full_name,
        report_date=datetime.now(timezone.utc),
        is_verified=True,
    )
    db.add(record)

    # Audit log
    audit = AuditLog(
        patient_id=patient.id,
        accessed_by=f"Lab: {current_user.full_name}",
        access_type="lab_upload",
        data_accessed=f"Uploaded report: {title}",
    )
    db.add(audit)
    db.commit()
    db.refresh(record)

    return {
        "message": "Report uploaded and processed",
        "record_id": record.id,
        "ai_summary": ai_result["summary"],
        "alert_level": ai_result["alert_level"],
        "alert_reason": ai_result["alert_reason"],
    }


# ─── VOICE AI ROUTES ────────────────────────────────────────────────────────

@app.post("/api/voice/summary", tags=["Voice AI"])
def voice_health_summary(
    req: VoiceQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a multilingual spoken health summary for the current user."""
    user_data = {
        "full_name": current_user.full_name,
        "blood_group": current_user.blood_group,
        "allergies": current_user.allergies,
        "chronic_conditions": current_user.chronic_conditions,
        "current_medications": current_user.current_medications,
    }

    summary = generate_voice_summary(user_data, req.language)

    # Log the session
    session = VoiceSession(
        patient_id=current_user.id,
        language=req.language,
        query="Health status request",
        response=summary,
    )
    db.add(session)
    db.commit()

    return {
        "voice_summary": summary,
        "language": req.language,
    }


# ─── HEALTH CHECK ───────────────────────────────────────────────────────────

@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "MedVault AI",
        "version": "1.0.0",
        "region": "IN",
    }
