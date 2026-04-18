# 🏥 MedVault AI

**India's Centralized Medical Identity Ecosystem — Golden Hour Ready**

> Save lives during the Golden Hour of an emergency while ensuring long-term healthcare accessibility for 1.4 billion Indians.

---

## 🎯 The Problem

Every year, thousands of Indians die during the **Golden Hour** — the critical 60 minutes after an accident — because emergency responders have no access to the patient's medical history. Allergies, blood group, chronic conditions, and current medications are locked away in paper files or scattered across hospital systems.

Meanwhile, **60%+ of India's population** (elderly, rural, illiterate) cannot navigate digital health portals to manage their own health data.

## 💡 The Solution

MedVault AI creates a **Universal Medical ID** (SHA-256 hash of Aadhaar) that links to a secure cloud vault. The system provides **four role-based interfaces**, each showing only the data that role needs — enforced by strict Role-Based Access Control (RBAC).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    MedVault AI                       │
├──────────┬──────────┬──────────┬────────────────────┤
│ Patient  │ Doctor   │ Emergency│ Lab Interface      │
│ Portal   │ Dashboard│ QR View  │ (Upload & OCR)     │
├──────────┴──────────┴──────────┴────────────────────┤
│              FastAPI Backend (Python)                 │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────┐ │
│  │  Auth   │ │ AI Engine│ │    OCR    │ │  RBAC  │ │
│  │(Aadhaar)│ │(Summarize│ │(Tesseract)│ │(JWT)   │ │
│  └─────────┘ └──────────┘ └───────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│               SQLite Database                        │
│  Users · Medical Records · Audit Logs · Voice AI     │
└─────────────────────────────────────────────────────┘
```

## ✨ Key Features

### 1. 🚨 Emergency QR Code (Golden Hour)
- No authentication required — scan and see life-critical data instantly
- Shows: Blood Group, Allergies, Chronic Conditions, Medications, Emergency Contact
- **Tap-to-call** emergency contact on mobile
- Every scan is logged in the **Break-Glass Audit Trail**

### 2. 🩺 Doctor Dashboard
- Search patients by Universal Medical ID
- Full clinical profile with AI-flagged **Red/Amber alerts** for abnormal values
- Access is logged and transparent to the patient

### 3. 🧪 Lab Direct Upload
- Diagnostic centers upload reports directly to a patient's vault
- **AI auto-summarizes** PDFs via OCR → parses lab values → flags critical markers
- Supported markers: Glucose, HbA1c, Creatinine, Troponin, TSH, Hemoglobin, Platelets, Cholesterol

### 4. 🗣️ Multilingual Voice AI
- Health summaries in **Hindi, Tamil, and English**
- Uses browser's free Speech Synthesis API — no paid services
- Designed for elderly & illiterate users: "आपको शुगर से बचना है" instead of "HbA1c: 7.2%"
- **Safety guardrails** prevent prescriptive language

### 5. 🔒 Security & Privacy
- **Aadhaar never stored** — only its SHA-256 hash (Universal Medical ID)
- JWT-based authentication with role-based access control
- Complete audit trail: patients see who accessed their data and when

---

## 🛠️ Tech Stack (100% Free)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vite + React + TypeScript | Fast, modern SPA |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Backend | FastAPI (Python) | High-performance API |
| Database | SQLite + SQLAlchemy | Zero-config, free DB |
| Auth | JWT + bcrypt | Token-based security |
| OCR | Tesseract (pytesseract) | Free text extraction |
| AI | Rule-based parser | No paid API needed |
| Voice | Web Speech Synthesis | Browser-native TTS |
| QR | qrserver.com API | Free QR generation |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- (Optional) Tesseract OCR: `brew install tesseract`

### Backend
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd client
npm install
npm install @tailwindcss/vite
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to `http://localhost:8000`.

### Demo Credentials
| Role | Aadhaar | Password |
|------|---------|----------|
| Patient | `123456789012` | `demo123` |
| Doctor | `987654321098` | `doctor123` |
| Lab | `111222333444` | `lab123` |

---

## 📁 Project Structure

```
medvault-ai/
├── client/                    # Vite + React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.tsx     # Role-aware navigation
│   │   ├── pages/
│   │   │   ├── Landing.tsx    # Hero + feature showcase
│   │   │   ├── Login.tsx      # Aadhaar-based auth
│   │   │   ├── Register.tsx   # New user registration
│   │   │   ├── PatientDashboard.tsx  # QR, Voice AI, Profile
│   │   │   ├── PatientRecords.tsx    # Records + AI summaries
│   │   │   ├── DoctorDashboard.tsx   # Search + clinical view
│   │   │   ├── EmergencyView.tsx     # QR scan landing (no auth)
│   │   │   └── LabInterface.tsx      # Drag-drop upload + AI
│   │   ├── lib/
│   │   │   └── api.ts         # API client + auth helpers
│   │   ├── App.tsx            # React Router setup
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Design system
│   └── index.html
├── server/                    # FastAPI Backend
│   ├── main.py                # All API routes
│   ├── auth.py                # Aadhaar hashing, JWT, RBAC
│   ├── models.py              # SQLAlchemy models (SQLite)
│   ├── ai_engine.py           # Report summarizer + Voice AI
│   ├── ocr_processor.py       # Tesseract OCR integration
│   ├── schema.sql             # Reference SQL schema
│   └── requirements.txt       # Python dependencies
└── README.md
```

---

## 👥 Team

Built for India 🇮🇳 at Hackathon 2026.

## 📄 License

MIT — Free and open source.
