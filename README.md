# SANGAM (संगम) — Government Interoperability Platform

### Smart India Hackathon 2026 — Problem Statement 129
**Government of Maharashtra**  
*System integration and interoperability among government digital platforms, resulting in fragmented service delivery.*

**Tagline:** *One Citizen. Connected Services. One Unified Journey.*

---

## 🏛️ Executive Summary

Government digital services in Maharashtra are currently segregated across distinct departmental portals (MahaDBT for scholarships, MahaBhumi for land/revenue records, e-Pramaan for identity, and Social Justice for welfare benefits). Consequently, citizens are forced to repeatedly submit physical or scanned documents (income certificates, 7/12 land records, caste certificates) to multiple portals.

**SANGAM** establishes a secure, consent-driven, federated interoperability layer that connects these fragmented platforms. When a citizen applies for higher education scholarships, Sangam automatically resolves cross-departmental identifiers, solicits explicit citizen consent, queries authentic departmental APIs, transforms heterogeneous data into a unified canonical schema, validates scheme thresholds, and logs an immutable audit trail without requiring the citizen to upload duplicate paper certificates.

---

## ⚡ Key Features

- **No Static Fake Data**: 100% database-backed with real CRUD operations, relationship schemas, and live persistence in SQLite (`sangam.sqlite3`).
- **Federated Identity Resolution**: Resolves a citizen's single Sangam ID (`SGM-MH-102934`) with upstream identifiers (`EDU-92831`, `REV-44921`, `WEL-77182`).
- **Citizen Data Sovereignty (Consent Center)**: Purpose-bound, time-delimited, and revocable consent workflow ensuring strict privacy compliance.
- **Simulated Departmental Micro-Connectors**:
  - **Higher & Technical Education (MahaDBT)**: Student enrollment, academic attendance, fee structures.
  - **Revenue & Land Records (MahaBhumi/Aaple Sarkar)**: Tehsildar-certified income figures, 7/12 land holdings.
  - **Social Justice & Welfare**: Caste classifications and direct benefit transfer (DBT) bank seeding.
  - **Citizen Registry (e-Pramaan)**: Master demographic verification.
- **Canonical Data Mapping & Validation Engine**: Harmonizes non-standard payloads (e.g. `income_amount` → `annualIncome`) and validates criteria (Income $\le$ ₹2,50,000).
- **Failure & Retry Engine**: Demonstrates live upstream timeout scenarios, flagging `FAILED` integration events and allowing administrators to trigger automated retries resulting in database-backed recovery.
- **Citizen 360 View**: Aggregated single-pane-of-glass profile unifying demographic, academic, revenue, welfare, application, and consent logs.
- **Sangam Sahayak AI & Voice**: Context-aware multilingual AI chatbot with Web Speech voice recognition (🎤) and speech readout (🔊) in English, Hindi, and Marathi.
- **Trilingual Localization**: Instant switching between English, हिन्दी, and मराठी across all interfaces without page reload.
- **Reactive Real-time Stream**: Server-Sent Events (SSE) `/api/events/stream` automatically push application status transitions, audit logs, and citizen notifications.

---

## 👥 Pre-Seeded Demo Accounts (1-Click Access)

The platform includes pre-seeded demo accounts accessible directly via the **1-Click Login** buttons on the Login page:

| Role | Name | Email | Password | Identifier |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | Ananya Ramesh Patil | `citizen@sangam.gov.in` | `citizen123` | Sangam ID: `SGM-MH-102934` |
| **Department Officer** | Suresh Deshmukh | `officer@sangam.gov.in` | `officer123` | Directorate of Higher Education |
| **Integration Admin** | Dr. Neha Kulkarni | `admin@sangam.gov.in` | `admin123` | Interoperability Operations Lead |

*(You can also use the Role Switcher buttons in the header navigation to instantly toggle roles during judging presentation).*

---

## 🔄 End-to-End Interoperability Demonstration

Click the prominent **"Run Interoperability Demo"** button on the header to walk judges through the complete 13-stage workflow:

1. **Citizen Selection**: Ananya Ramesh Patil (`SGM-MH-102934`).
2. **Scholarship Initiation**: Initiates Post-Matric Higher Education Scholarship.
3. **Identity Resolution**: Resolves Education ID `EDU-92831` and Revenue ID `REV-44921`.
4. **Consent Request Generation**: Generates explicit consent request for Revenue records.
5. **Citizen Approves Consent**: Citizen grants permission via the Consent Center.
6. **Connector Dispatch**: Sangam queries the MahaBhumi Revenue Gateway.
7. **Department Record Retrieved**: Certified income (`₹1,80,000`) and landholding (`1.5 acres`) received.
8. **Canonical Mapping**: Source field `income_amount` transformed to canonical `annualIncome`.
9. **Data Validation**: Rules engine checks threshold ($\le$ ₹2.5L) and certificate validity.
10. **Application Updated**: Verified records attached and status set to `UNDER_REVIEW`.
11. **Real-time Notification**: Citizen notified that documents were verified with zero uploads.
12. **Audit Logging**: Immutable audit entry recorded with cryptographic timestamps.
13. **Officer Sanction**: Department officer reviews verified records and approves the scheme.

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Web Speech API (Voice input & synthesis).
- **Backend API**: Express.js, JWT Authentication, Server-Sent Events (SSE), CORS.
- **Database**: SQLite (via `sql.js` WebAssembly engine) with disk persistence (`sangam.sqlite3`).
- **AI Engine**: Sangam Sahayak with context-aware semantic reasoning + optional Gemini / OpenAI API integration.

```
React Frontend (Vite)
       │  HTTP / REST + SSE (/api/events/stream)
       ▼
Express API Gateway (Port 5000)
       ├── Authentication Middleware (JWT + RBAC)
       ├── Identity Resolution Service
       ├── Consent Management Service
       ├── Workflow & Interoperability Engine
       ├── Canonical Mapping Service
       ├── Validation & Data Quality Engine
       ├── Notification & Audit Services
       └── Departmental Connectors
             ├── Education Connector (MahaDBT)
             ├── Revenue Connector (MahaBhumi)
             ├── Welfare Connector (Social Justice)
             └── Citizen Registry Connector (e-Pramaan)
       │
       ▼
SQLite Database (sangam.sqlite3)
```

---

## 🚀 Getting Started

### 1. Installation

Ensure Node.js (v20+ or v22+) is installed.

```bash
# Navigate to the project root
cd C:\Users\HP\.gemini\antigravity\scratch\sangam

# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Build Frontend

```bash
npm run build
```

### 3. Run Production Server (Full-Stack Unified)

```bash
npm start
```
Open **`http://localhost:5000`** in your browser.

### 4. Development Mode (Hot-Reload)

```bash
npm run dev
```
Runs the Express backend on `http://localhost:5000` and Vite dev server on `http://localhost:5173`.

### 5. Reset / Re-seed Demo Database

To reset the database to a fresh state with all demo accounts and connectors:

```bash
npm run seed
```
*(Or click the "Reset Demo DB" button in the Integration Admin Dashboard).*

---

## 📋 Environment Variables (`.env`)

```env
PORT=5000
NODE_ENV=production
APP_URL=http://localhost:5000
JWT_SECRET=sangam-sih2026-secret-key-gov-mh-interop-platform
DATABASE_PATH=./server/sangam.sqlite3

# Optional: Add external LLM key if desired (Built-in assistant active by default)
# GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🎯 Verification Matrix for SIH Judges

- [x] **No static mockups**: All records load and persist in real SQLite database.
- [x] **Departmental Interoperability**: Automatic data exchange between Education and Revenue systems.
- [x] **Consent Enforcement**: Cross-system queries strictly blocked until citizen approves consent.
- [x] **Failure & Retry Scenario**: Simulate Revenue failure with 1 click; retry in Admin panel to demonstrate recovery.
- [x] **Citizen 360**: Real-time aggregation of Education, Revenue, and Welfare records.
- [x] **Trilingual**: Complete English, Hindi, and Marathi translations.
- [x] **Voice Assistant**: Voice query input and audio readout in all three languages.
- [x] **Audit Trail**: Non-repudiable logs for every consent, integration, and status update.
