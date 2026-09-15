"""
APCR — Academic Priority Conflict Resolution
Novel Contribution #4

Resolves conflicts between competing network intents using the Academic Priority Taxonomy.
"""
import uuid
import json
from datetime import datetime
from backend.config import ACADEMIC_PRIORITY, SEGMENTS
from backend.db.connection import get_db


def detect_conflicts(new_intent: dict, active_intents: list[dict]) -> list[dict]:
    """Check if new_intent conflicts with any active intent (same zone, overlapping bandwidth)."""
    conflicts = []
    for active in active_intents:
        shared_segments = set(new_intent.get("target_segments", [])) & set(active.get("target_segments", []))
        if not shared_segments:
            continue
        both_allocate = new_intent["action"] in ("allocate",) and active["action"] in ("allocate",)
        if not both_allocate:
            continue
        # Check bandwidth availability for shared segments
        for seg_id in shared_segments:
            seg = SEGMENTS.get(seg_id)
            if not seg:
                continue
            total = seg["total_bandwidth_mbps"]
            combined = (new_intent.get("bandwidth_mbps") or 0) + (active.get("bandwidth_mbps") or 0)
            if combined > total:
                conflicts.append({
                    "conflicting_intent_id": active["id"],
                    "segment_id": seg_id,
                    "available_mbps": total,
                    "requested_combined_mbps": combined,
                    "overflow_mbps": combined - total,
                })
    return conflicts


def resolve_conflicts(new_intent: dict, conflicts: list[dict], active_intents: list[dict]) -> dict:
    """
    Apply APCR resolution strategy and return resolution metadata.
    Resolution priority: new_intent priority vs conflicting intent priority.
    """
    if not conflicts:
        return {"action": "no_conflict", "explanation": "No resource conflicts detected.", "adjustments": []}

    resolution_id = str(uuid.uuid4())
    adjustments = []
    resolution_action = "no_conflict"

    for conflict in conflicts:
        conflicting = next((i for i in active_intents if i["id"] == conflict["conflicting_intent_id"]), None)
        if not conflicting:
            continue

        new_priority = new_intent.get("priority", 30)
        existing_priority = conflicting.get("priority", 30)
        seg = SEGMENTS.get(conflict["segment_id"], {})
        available = seg.get("total_bandwidth_mbps", 100)

        if new_priority > existing_priority:
            # New intent wins — preempt lower priority
            reduced = max(0, available - (new_intent.get("bandwidth_mbps") or 0))
            adjustments.append({
                "segment_id": conflict["segment_id"],
                "winner": new_intent["id"],
                "loser": conflicting["id"],
                "winner_gets_mbps": new_intent.get("bandwidth_mbps"),
                "loser_reduced_to_mbps": reduced,
            })
            resolution_action = "preemption"
            academic_justification = (
                f"'{new_intent['action'].title()}' intent (priority {new_priority} — "
                f"{_priority_label(new_priority)}) preempts existing intent "
                f"(priority {existing_priority} — {_priority_label(existing_priority)}) "
                f"per Academic Priority Taxonomy."
            )
        elif new_priority < existing_priority:
            # Existing wins — reduce new intent
            reduced = max(0, available - (conflicting.get("bandwidth_mbps") or 0))
            adjustments.append({
                "segment_id": conflict["segment_id"],
                "winner": conflicting["id"],
                "loser": new_intent["id"],
                "winner_gets_mbps": conflicting.get("bandwidth_mbps"),
                "loser_reduced_to_mbps": reduced,
            })
            resolution_action = "graceful_degradation"
            academic_justification = (
                f"Existing intent (priority {existing_priority} — {_priority_label(existing_priority)}) "
                f"takes precedence over new intent (priority {new_priority} — {_priority_label(new_priority)})."
            )
        else:
            # Equal priority — proportional share
            share = available // 2
            adjustments.append({
                "segment_id": conflict["segment_id"],
                "winner": None,
                "loser": None,
                "proportional_share_mbps": share,
            })
            resolution_action = "proportional"
            academic_justification = (
                f"Equal academic priority ({new_priority}) — bandwidth split proportionally: "
                f"{share}Mbps each on segment '{conflict['segment_id']}'."
            )

    resolution = {
        "id": resolution_id,
        "new_intent_id": new_intent["id"],
        "resolution_action": resolution_action,
        "adjustments": adjustments,
        "academic_justification": academic_justification if adjustments else "No conflict.",
        "timestamp": datetime.now().isoformat(),
    }
    return resolution


def _priority_label(priority: int) -> str:
    for label, val in ACADEMIC_PRIORITY.items():
        if val == priority:
            return label.replace("_", " ").title()
    if priority >= 90:
        return "Exam"
    if priority >= 60:
        return "Lab/Lecture"
    if priority >= 40:
        return "Research/Event"
    return "General"


async def log_resolution(resolution: dict):
    db = await get_db()
    await db.execute(
        """INSERT INTO apcr_log (id, intent_a_id, intent_b_id, resolution_action,
           academic_justification, bandwidth_reassignment) VALUES (?,?,?,?,?,?)""",
        (
            resolution["id"],
            resolution.get("new_intent_id"),
            json.dumps([a.get("loser") or a.get("winner") for a in resolution.get("adjustments", [])]),
            resolution["resolution_action"],
            resolution.get("academic_justification", ""),
            json.dumps(resolution.get("adjustments", [])),
        ),
    )
    await db.commit()


async def get_apcr_log(limit: int = 50) -> list[dict]:
    db = await get_db()
    cursor = await db.execute("SELECT * FROM apcr_log ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]
