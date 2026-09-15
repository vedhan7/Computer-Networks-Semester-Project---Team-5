"""
ERP Seed Data — One full week of realistic college academic schedule.
Run once on startup to populate the academic_events table.
"""
import json
import uuid
from datetime import datetime, timedelta

# Base date: Monday of current week
def get_week_start():
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    # Go back to Monday
    return today - timedelta(days=today.weekday())


def make_event(
    title, event_type, department, venue, day_offset,
    start_hour, start_min, duration_hours,
    expected_users, bandwidth_profile,
    requires_security_lockdown, network_segments
):
    base = get_week_start() + timedelta(days=day_offset)
    start = base.replace(hour=start_hour, minute=start_min)
    end = start + timedelta(hours=duration_hours)
    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "event_type": event_type,
        "department": department,
        "venue": venue,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "expected_users": expected_users,
        "bandwidth_profile": bandwidth_profile,
        "requires_security_lockdown": 1 if requires_security_lockdown else 0,
        "network_segments": json.dumps(network_segments),
    }


SEED_EVENTS = [
    # ── MONDAY ───────────────────────────────────────────────────────────────
    make_event("CS301 - Data Structures Lecture", "lecture", "CSE", "halls_a", 0,
               9, 0, 1, 80, "medium", False, ["halls_a"]),
    make_event("CS401 - Computer Networks Lecture", "lecture", "CSE", "halls_a", 0,
               10, 0, 1, 75, "medium", False, ["halls_a"]),
    make_event("Free Period / Library", "free", None, "library", 0,
               11, 0, 1, 150, "low", False, ["library", "hostel"]),
    make_event("CS Lab - Python Programming", "lab", "CSE", "Programming Lab A1", 0,
               14, 0, 2, 58, "high", False, ["lab_a1", "block_a"]),
    make_event("EC Lab - Circuit Design", "lab", "ECE", "Electronics Lab A2", 0,
               14, 0, 2, 38, "medium", False, ["lab_a2", "block_a"]),
    make_event("CS501 - Machine Learning Lecture", "lecture", "CSE", "halls_a", 0,
               16, 0, 1, 60, "medium", False, ["halls_a"]),

    # ── TUESDAY ──────────────────────────────────────────────────────────────
    make_event("MA201 - Linear Algebra Lecture", "lecture", "MATH", "halls_a", 1,
               9, 0, 1, 90, "low", False, ["halls_a"]),
    make_event("CS Lab - Web Development", "lab", "CSE", "Programming Lab A1", 1,
               10, 0, 2, 55, "high", False, ["lab_a1", "block_a"]),
    make_event("NW Lab - Packet Tracer Simulation", "lab", "CSE", "Network Lab B1", 1,
               10, 0, 2, 28, "high", False, ["lab_b1", "block_b"]),
    make_event("Internal Exam - CS301 Data Structures", "exam", "CSE", "Exam Hall", 1,
               14, 0, 3, 195, "critical", True, ["exam_hall", "block_b"]),
    make_event("CS601 - Cloud Computing Lecture", "lecture", "CSE", "halls_a", 1,
               17, 0, 1, 45, "medium", False, ["halls_a"]),

    # ── WEDNESDAY ────────────────────────────────────────────────────────────
    make_event("CS Lab - Data Structures Lab", "lab", "CSE", "Programming Lab A1", 2,
               9, 0, 2, 60, "high", False, ["lab_a1", "block_a"]),
    make_event("EC201 - Digital Electronics Lecture", "lecture", "ECE", "halls_a", 2,
               11, 0, 1, 70, "low", False, ["halls_a"]),
    make_event("ONLINE EXAM - University External Assessment", "exam", "ALL", "Exam Hall", 2,
               14, 0, 3, 200, "critical", True, ["exam_hall", "block_b", "campus_root"]),
    make_event("Hackathon - Smart Campus Innovation", "event", "CSE", "Programming Lab A1", 2,
               18, 0, 4, 120, "high", False, ["lab_a1", "lab_b1", "block_a", "block_b"]),

    # ── THURSDAY ─────────────────────────────────────────────────────────────
    make_event("CS401 - Distributed Systems Lecture", "lecture", "CSE", "halls_a", 3,
               9, 0, 1, 65, "medium", False, ["halls_a"]),
    make_event("EC Lab - VLSI Design", "lab", "ECE", "Electronics Lab A2", 3,
               10, 0, 2, 35, "medium", False, ["lab_a2", "block_a"]),
    make_event("Internal Exam - MA201 Linear Algebra", "exam", "MATH", "Exam Hall", 3,
               14, 0, 2, 180, "critical", True, ["exam_hall", "block_b"]),
    make_event("NW Lab - Network Security Lab", "lab", "CSE", "Network Lab B1", 3,
               16, 0, 2, 26, "high", False, ["lab_b1", "block_b"]),
    make_event("Research Seminar - AI in Networking", "event", "CSE", "halls_a", 3,
               18, 0, 2, 80, "medium", False, ["halls_a", "library"]),

    # ── FRIDAY ───────────────────────────────────────────────────────────────
    make_event("CS Lab - Operating Systems", "lab", "CSE", "Programming Lab A1", 4,
               9, 0, 2, 57, "high", False, ["lab_a1", "block_a"]),
    make_event("CS501 - AI Lecture", "lecture", "CSE", "halls_a", 4,
               11, 0, 1, 68, "medium", False, ["halls_a"]),
    make_event("Free - Hostel/Library Peak", "free", None, "library", 4,
               12, 0, 2, 250, "medium", False, ["library", "hostel", "admin_block"]),
    make_event("ONLINE EXAM - Makeup Test CSE Batch", "exam", "CSE", "Exam Hall", 4,
               14, 0, 2, 90, "critical", True, ["exam_hall", "block_b"]),
    make_event("Hackathon - 24hr Code Sprint", "event", "CSE", "Programming Lab A1", 4,
               18, 0, 4, 100, "high", False, ["lab_a1", "lab_b1", "block_a", "block_b"]),
]


async def seed_database():
    from backend.db.connection import get_db
    from backend.config import SEGMENTS

    db = await get_db()

    # Check if already seeded
    row = await db.execute("SELECT COUNT(*) as cnt FROM academic_events")
    result = await row.fetchone()
    if result["cnt"] > 0:
        return  # already seeded

    # Seed segments
    for seg_id, seg in SEGMENTS.items():
        await db.execute(
            """INSERT OR IGNORE INTO network_segments (id, name, parent_id, total_bandwidth_mbps, device_count, location)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (seg_id, seg["name"], seg.get("parent_id"), seg["total_bandwidth_mbps"],
             seg.get("device_count", 0), seg.get("location", "")),
        )

    # Seed ERP events
    for ev in SEED_EVENTS:
        await db.execute(
            """INSERT OR IGNORE INTO academic_events
               (id, title, event_type, department, venue, start_time, end_time,
                expected_users, bandwidth_profile, requires_security_lockdown, network_segments)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (ev["id"], ev["title"], ev["event_type"], ev.get("department"),
             ev["venue"], ev["start_time"], ev["end_time"], ev["expected_users"],
             ev["bandwidth_profile"], ev["requires_security_lockdown"], ev["network_segments"]),
        )

    await db.commit()
    print(f"[ACORN] Seeded {len(SEED_EVENTS)} academic events and {len(SEGMENTS)} network segments.")
