-- MedVault AI - Database Schema (SQLite)
-- This file is for reference only. SQLAlchemy auto-creates tables via models.py

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medical_id VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    date_of_birth VARCHAR(10),
    gender VARCHAR(20),
    phone VARCHAR(15),
    email VARCHAR(200),
    role VARCHAR(20) DEFAULT 'patient',
    password_hash VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10),
    allergies TEXT,
    chronic_conditions TEXT,
    current_medications TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(15),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES users(id),
    uploaded_by INTEGER REFERENCES users(id),
    record_type VARCHAR(30) DEFAULT 'other',
    title VARCHAR(300) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    ocr_text TEXT,
    ai_summary TEXT,
    alert_level VARCHAR(10) DEFAULT 'normal',
    alert_reason TEXT,
    lab_name VARCHAR(300),
    lab_license VARCHAR(100),
    report_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES users(id),
    accessed_by VARCHAR(200),
    access_type VARCHAR(50),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    data_accessed TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS voice_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES users(id),
    language VARCHAR(20) DEFAULT 'hi',
    query TEXT,
    response TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
