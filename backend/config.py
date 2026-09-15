"""
ACORN Configuration
"""

# ── Auth ──────────────────────────────────────────────────────────────────────
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "acorn2026"
VIEWER_USERNAME = "viewer"
VIEWER_PASSWORD = "viewer123"
JWT_SECRET = "acorn-secret-key-change-in-production-2026"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 480  # 8 hours

# ── Backend URL ───────────────────────────────────────────────────────────────
BACKEND_HOST = "0.0.0.0"
BACKEND_PORT = 8000

# ── Network Segments ─────────────────────────────────────────────────────────
SEGMENTS = {
    "campus_root": {
        "name": "Campus Internet Uplink",
        "parent_id": None,
        "total_bandwidth_mbps": 1000,
        "device_count": 0,
        "location": "Main Server Room",
    },
    "block_a": {
        "name": "Academic Block A",
        "parent_id": "campus_root",
        "total_bandwidth_mbps": 300,
        "device_count": 0,
        "location": "Block A",
    },
    "lab_a1": {
        "name": "Programming Lab A1",
        "parent_id": "block_a",
        "total_bandwidth_mbps": 120,
        "device_count": 62,
        "location": "Block A, Room 101",
    },
    "lab_a2": {
        "name": "Electronics Lab A2",
        "parent_id": "block_a",
        "total_bandwidth_mbps": 80,
        "device_count": 42,
        "location": "Block A, Room 102",
    },
    "halls_a": {
        "name": "Lecture Halls H1–H4",
        "parent_id": "block_a",
        "total_bandwidth_mbps": 100,
        "device_count": 120,
        "location": "Block A, Halls",
    },
    "block_b": {
        "name": "Academic Block B",
        "parent_id": "campus_root",
        "total_bandwidth_mbps": 200,
        "device_count": 0,
        "location": "Block B",
    },
    "lab_b1": {
        "name": "Network Lab B1",
        "parent_id": "block_b",
        "total_bandwidth_mbps": 80,
        "device_count": 32,
        "location": "Block B, Room 201",
    },
    "exam_hall": {
        "name": "Exam Hall",
        "parent_id": "block_b",
        "total_bandwidth_mbps": 120,
        "device_count": 205,
        "location": "Block B, Exam Wing",
    },
    "hostel": {
        "name": "Student Hostel",
        "parent_id": "campus_root",
        "total_bandwidth_mbps": 150,
        "device_count": 400,
        "location": "Hostel Block",
    },
    "admin_block": {
        "name": "Admin & Faculty",
        "parent_id": "campus_root",
        "total_bandwidth_mbps": 100,
        "device_count": 80,
        "location": "Admin Block",
    },
    "library": {
        "name": "Library & Common Areas",
        "parent_id": "campus_root",
        "total_bandwidth_mbps": 250,
        "device_count": 200,
        "location": "Central Library",
    },
}

# ── Bandwidth Profiles ────────────────────────────────────────────────────────
BANDWIDTH_PROFILES = {
    "low": {"mbps_per_user": 0.5, "burst_factor": 1.2},
    "medium": {"mbps_per_user": 1.5, "burst_factor": 1.5},
    "high": {"mbps_per_user": 3.0, "burst_factor": 2.0},
    "critical": {"mbps_per_user": 5.0, "burst_factor": 1.1},  # exam: steady, not bursty
}

# ── Academic Priority Taxonomy ─────────────────────────────────────────────────
ACADEMIC_PRIORITY = {
    "exam": 100,
    "accreditation_event": 95,
    "lab": 70,
    "lecture": 60,
    "admin_erp": 55,
    "research": 45,
    "event": 40,
    "general_student": 30,
    "staff_general": 20,
    "free": 10,
    "maintenance": 5,
}

# ── Criticality Weights for CRATE ─────────────────────────────────────────────
CRITICALITY_WEIGHTS = {
    "exam": 2.5,
    "lab": 1.5,
    "lecture": 1.2,
    "event": 1.1,
    "free": 0.8,
    "maintenance": 0.5,
}

# ── TIPS Timing ──────────────────────────────────────────────────────────────
TIPS_STAGE_MINUTES_BEFORE = 30
TIPS_ARM_MINUTES_BEFORE = 5
TIPS_SCHEDULER_INTERVAL_SECONDS = 30

# ── CASH / Monitor intervals ─────────────────────────────────────────────────
NETWORK_TICK_INTERVAL_SECONDS = 2
CASH_CHECK_INTERVAL_SECONDS = 5
ERP_CHECK_INTERVAL_SECONDS = 60

# ── Database ──────────────────────────────────────────────────────────────────
DB_PATH = "acorn.db"
