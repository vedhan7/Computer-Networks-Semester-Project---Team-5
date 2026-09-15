# ACORN: Academic Context-Orchestrated Resilient Network

ACORN is an AI-Driven, Context-Aware, Intent-Based, Self-Healing Smart Campus Network. It is designed to autonomously manage a college campus network by directly integrating with the institution's ERP system. ACORN anticipates network load, automatically translates academic events into network policies, prevents conflicts, and self-heals in real-time.

## Features & Novel Contributions

1. **ENCI (ERP-to-Network Contextual Intent-Translator):** Directly ingests college timetables (exams, labs, lectures) and automatically generates Natural Language network intents using a custom academic ontology.
2. **TIPS (Temporal Intent Pre-Staging Pipeline):** A 4-phase lifecycle manager (Draft → Staged → Armed → Active) that prepares network policies ahead of time based on ERP schedules (e.g., locking down exam halls exactly 5 minutes before the exam starts).
3. **CRATE (Context-Relative Anomaly Threshold Engine):** Instead of static thresholds, CRATE evaluates network health (CNHS) based on what is *supposed* to be happening. 80% utilization during a free period is an anomaly; 80% during an online exam is expected.
4. **APCR (Academic Priority Conflict Resolver):** When multiple intents target the same network segment, APCR uses a strict academic taxonomy (Exam > Lab > Lecture) to resolve conflicts via preemption, graceful degradation, or proportional sharing.
5. **CASH (Context-Aware Self-Healing Matrix):** A 25-cell matrix that maps network faults to the current academic context, determining the exact aggression level required for automated recovery (e.g., an aggressive link-reset during an exam vs. a soft re-route during a free period).

## Tech Stack (100% Free & Open Source)

*   **Backend:** Python, FastAPI, SQLite (WAL mode)
*   **Frontend:** React, Next.js 16 (App Router), Recharts
*   **Real-time:** WebSockets
*   **ML/Heuristics:** scikit-learn (simulated/rule-based heuristics)

## Getting Started

### Prerequisites
*   Node.js 20+
*   Python 3.10+

### 1. Start the Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/Mac
pip install -r ../requirements.txt

# Seed the database with a simulated week of ERP events
python seed.py

# Run the server
python main.py
```

The backend runs on `http://localhost:8000`.

### 2. Start the Frontend (Next.js)

Open a new terminal.

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

### 3. Login
Navigate to `http://localhost:3000` and login with the default credentials:
*   Username: `admin`
*   Password: `acorn2026`

## Architecture

```text
[ ERP Timetable ] -> (ENCI) -> Natural Language Intents
                                      ↓
[ Network State ] -> (CRATE) -> (TIPS Pipeline) <-> (APCR Resolver)
       ↑                              ↓
(CASH Healer) <---------- [ Network Simulation / Enforcement ]
```

## Academic & Patent Scope

This project is structured specifically to provide a strong foundation for an IEEE publication and potential patent filing. It introduces novel architectural concepts (the 5 modules above) that solve the specific domain problem of dynamic campus network management. Please refer to `PAPER_NOTES.md` for a structured technical write-up aligned with IEEE paper formatting.

---
*Developed by the Academic Networks Research Lab.*
