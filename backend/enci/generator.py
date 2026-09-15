"""
ENCI Intent Generator — Novel Contribution #1
Automatically derives network intents from ERP academic events.
No human input required.
"""
import uuid
from datetime import datetime
from backend.erp.models import AcademicEvent
from backend.enci.ontology import ACADEMIC_EVENT_ONTOLOGY
from backend.config import ACADEMIC_PRIORITY, BANDWIDTH_PROFILES, SEGMENTS


def generate_intents_for_event(event: AcademicEvent) -> list[dict]:
    """
    Core ENCI function: maps an AcademicEvent → list of network intent dicts.
    These become StagedIntents in the TIPS lifecycle.
    """
    profile = ACADEMIC_EVENT_ONTOLOGY.get(event.event_type)
    if not profile:
        return []

    bw_profile = BANDWIDTH_PROFILES[event.bandwidth_profile]
    priority = ACADEMIC_PRIORITY.get(event.event_type, 30)
    intents = []

    # ── Intent 1: Bandwidth Allocation ───────────────────────────────────────
    total_mbps = int(event.expected_users * bw_profile["mbps_per_user"])
    intents.append({
        "id": str(uuid.uuid4()),
        "source": "ERP_AUTO",
        "raw_text": f"Allocate {total_mbps}Mbps for {event.event_type} '{event.title}' in {event.venue}",
        "action": "allocate",
        "target_services": profile.primary_services,
        "target_segments": event.network_segments,
        "bandwidth_mbps": total_mbps,
        "priority": priority,
        "erp_event_id": event.id,
        "activate_at": event.start_time.isoformat(),
        "deactivate_at": event.end_time.isoformat(),
        "qos_dscp": profile.qos_dscp,
        "description": f"Auto-generated bandwidth allocation for {event.event_type}",
    })

    # ── Intent 2: Service Block (if any) ─────────────────────────────────────
    if profile.blocked_services:
        intents.append({
            "id": str(uuid.uuid4()),
            "source": "ERP_AUTO",
            "raw_text": f"Block {', '.join(profile.blocked_services[:3])} during '{event.title}'",
            "action": "block",
            "target_services": profile.blocked_services,
            "target_segments": event.network_segments,
            "bandwidth_mbps": None,
            "priority": priority,
            "erp_event_id": event.id,
            "activate_at": event.start_time.isoformat(),
            "deactivate_at": event.end_time.isoformat(),
            "qos_dscp": 0,
            "description": f"Auto-generated traffic block for {event.event_type}",
        })

    # ── Intent 3: Security Lockdown (exams only) ──────────────────────────────
    if event.requires_security_lockdown:
        intents.append({
            "id": str(uuid.uuid4()),
            "source": "ERP_AUTO",
            "raw_text": f"Apply security lockdown for exam '{event.title}' in {event.venue}",
            "action": "lockdown",
            "target_services": ["exam_portal"],
            "target_segments": event.network_segments,
            "bandwidth_mbps": None,
            "priority": 100,  # always highest
            "erp_event_id": event.id,
            "activate_at": event.start_time.isoformat(),
            "deactivate_at": event.end_time.isoformat(),
            "qos_dscp": 46,
            "description": "Auto-generated security lockdown: whitelist-only traffic enforced",
        })

    return intents


def generate_description_for_event(event: AcademicEvent) -> str:
    """Human-readable ENCI summary for dashboard display."""
    profile = ACADEMIC_EVENT_ONTOLOGY.get(event.event_type)
    if not profile:
        return "No ENCI profile found."
    lines = [
        f"**ENCI Profile**: {event.event_type.upper()}",
        f"**Primary Services**: {', '.join(profile.primary_services)}",
        f"**Bandwidth Model**: {profile.bandwidth_model}",
        f"**Security Level**: {profile.security_level}/5",
        f"**QoS DSCP**: {profile.qos_dscp}",
        f"**Description**: {profile.description}",
    ]
    if profile.blocked_services:
        lines.append(f"**Blocked Services**: {', '.join(profile.blocked_services[:5])}")
    return "\n".join(lines)
