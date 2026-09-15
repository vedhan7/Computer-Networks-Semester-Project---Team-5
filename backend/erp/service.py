"""
ERP Service — queries and demand prediction.
"""
import json
from datetime import datetime, timedelta
from typing import Optional
from backend.db.connection import get_db
from backend.erp.models import AcademicEvent, ERPContext
from backend.config import SEGMENTS, BANDWIDTH_PROFILES


def _row_to_event(row) -> AcademicEvent:
    return AcademicEvent(
        id=row["id"],
        title=row["title"],
        event_type=row["event_type"],
        department=row["department"],
        venue=row["venue"],
        start_time=datetime.fromisoformat(row["start_time"]),
        end_time=datetime.fromisoformat(row["end_time"]),
        expected_users=row["expected_users"],
        bandwidth_profile=row["bandwidth_profile"],
        requires_security_lockdown=bool(row["requires_security_lockdown"]),
        network_segments=json.loads(row["network_segments"]),
    )


async def get_all_events() -> list[AcademicEvent]:
    db = await get_db()
    cursor = await db.execute("SELECT * FROM academic_events ORDER BY start_time")
    rows = await cursor.fetchall()
    return [_row_to_event(r) for r in rows]


async def get_events_for_day(date: datetime) -> list[AcademicEvent]:
    db = await get_db()
    day_start = date.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    day_end = date.replace(hour=23, minute=59, second=59).isoformat()
    cursor = await db.execute(
        "SELECT * FROM academic_events WHERE start_time >= ? AND start_time <= ? ORDER BY start_time",
        (day_start, day_end),
    )
    rows = await cursor.fetchall()
    return [_row_to_event(r) for r in rows]


async def get_events_in_window(start: datetime, end: datetime) -> list[AcademicEvent]:
    db = await get_db()
    cursor = await db.execute(
        "SELECT * FROM academic_events WHERE start_time >= ? AND start_time <= ? ORDER BY start_time",
        (start.isoformat(), end.isoformat()),
    )
    rows = await cursor.fetchall()
    return [_row_to_event(r) for r in rows]


async def get_active_event(now: Optional[datetime] = None) -> Optional[AcademicEvent]:
    now = now or datetime.now()
    db = await get_db()
    cursor = await db.execute(
        "SELECT * FROM academic_events WHERE start_time <= ? AND end_time >= ? LIMIT 1",
        (now.isoformat(), now.isoformat()),
    )
    row = await cursor.fetchone()
    return _row_to_event(row) if row else None


def compute_predicted_loads(event: AcademicEvent) -> dict[str, float]:
    """
    Given an academic event, compute expected utilization per network segment.
    This is the ERP-predicted baseline used by CRATE.
    """
    profile = BANDWIDTH_PROFILES[event.bandwidth_profile]
    loads: dict[str, float] = {}

    for seg_id in event.network_segments:
        seg = SEGMENTS.get(seg_id)
        if not seg:
            continue
        capacity = seg["total_bandwidth_mbps"]
        expected_load_mbps = event.expected_users * profile["mbps_per_user"]
        utilization = min(1.0, expected_load_mbps / capacity)
        loads[seg_id] = round(utilization, 4)

    # All other segments get idle baseline
    for seg_id in SEGMENTS:
        if seg_id not in loads:
            loads[seg_id] = 0.18  # idle ~18%

    return loads


def compute_demand_level(event: Optional[AcademicEvent]) -> str:
    if event is None:
        return "idle"
    if event.bandwidth_profile == "critical":
        return "peak"
    if event.bandwidth_profile == "high":
        return "high"
    if event.expected_users > 100:
        return "moderate"
    if event.bandwidth_profile == "medium":
        return "low"
    return "idle"


async def get_current_context() -> ERPContext:
    now = datetime.now()
    active = await get_active_event(now)
    upcoming = await get_events_in_window(now, now + timedelta(hours=2))
    # Remove current from upcoming
    upcoming = [e for e in upcoming if e.id != (active.id if active else None)]

    predicted = compute_predicted_loads(active) if active else {seg: 0.18 for seg in SEGMENTS}
    demand = compute_demand_level(active)

    return ERPContext(
        timestamp=now,
        active_event=active,
        upcoming_events=upcoming[:4],
        predicted_segment_loads=predicted,
        overall_demand_level=demand,  # type: ignore
    )
