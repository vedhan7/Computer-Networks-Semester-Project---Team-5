"""
ERP Pydantic models.
"""
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class AcademicEvent(BaseModel):
    id: str
    title: str
    event_type: Literal["lecture", "lab", "exam", "event", "free"]
    department: Optional[str] = None
    venue: str
    start_time: datetime
    end_time: datetime
    expected_users: int
    bandwidth_profile: Literal["low", "medium", "high", "critical"]
    requires_security_lockdown: bool
    network_segments: list[str]


class ERPContext(BaseModel):
    timestamp: datetime
    active_event: Optional[AcademicEvent] = None
    upcoming_events: list[AcademicEvent] = []
    predicted_segment_loads: dict[str, float] = {}
    overall_demand_level: Literal["idle", "low", "moderate", "high", "peak"] = "idle"
