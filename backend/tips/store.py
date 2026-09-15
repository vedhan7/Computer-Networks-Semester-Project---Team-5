"""
TIPS — Temporal Intent Pre-Staging
Novel Contribution #3: 4-phase intent lifecycle tied to ERP schedule.
"""
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional
from backend.db.connection import get_db
from backend.config import TIPS_STAGE_MINUTES_BEFORE, TIPS_ARM_MINUTES_BEFORE


# ── In-memory registry (also written to SQLite) ───────────────────────────────
_intents: dict[str, dict] = {}  # id → intent dict


async def get_all_intents() -> list[dict]:
    db = await get_db()
    cursor = await db.execute("SELECT * FROM staged_intents ORDER BY created_at DESC")
    rows = await cursor.fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["target_services"] = json.loads(d["target_services"] or "[]")
        d["target_segments"] = json.loads(d["target_segments"] or "[]")
        result.append(d)
    return result


async def get_active_intents() -> list[dict]:
    db = await get_db()
    cursor = await db.execute(
        "SELECT * FROM staged_intents WHERE lifecycle_status = 'active' ORDER BY created_at DESC"
    )
    rows = await cursor.fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["target_services"] = json.loads(d["target_services"] or "[]")
        d["target_segments"] = json.loads(d["target_segments"] or "[]")
        result.append(d)
    return result


async def store_intent(intent: dict) -> str:
    db = await get_db()
    intent.setdefault("id", str(uuid.uuid4()))
    intent.setdefault("lifecycle_status", "draft")
    await db.execute(
        """INSERT OR REPLACE INTO staged_intents
           (id, source, raw_text, action, target_services, target_segments,
            bandwidth_mbps, priority, lifecycle_status, erp_event_id, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        (
            intent["id"],
            intent.get("source", "ADMIN_MANUAL"),
            intent.get("raw_text", ""),
            intent.get("action", "allocate"),
            json.dumps(intent.get("target_services", [])),
            json.dumps(intent.get("target_segments", [])),
            intent.get("bandwidth_mbps"),
            intent.get("priority", 30),
            intent["lifecycle_status"],
            intent.get("erp_event_id"),
            datetime.now().isoformat(),
        ),
    )
    await db.commit()
    _intents[intent["id"]] = intent
    return intent["id"]


async def update_status(intent_id: str, status: str, field: Optional[str] = None):
    db = await get_db()
    now = datetime.now().isoformat()
    if field:
        await db.execute(
            f"UPDATE staged_intents SET lifecycle_status=?, {field}=? WHERE id=?",
            (status, now, intent_id),
        )
    else:
        await db.execute(
            "UPDATE staged_intents SET lifecycle_status=? WHERE id=?",
            (status, intent_id),
        )
    await db.commit()
    if intent_id in _intents:
        _intents[intent_id]["lifecycle_status"] = status


async def get_tips_pipeline() -> dict:
    """Returns intents grouped by lifecycle phase for dashboard pipeline view."""
    all_intents = await get_all_intents()
    pipeline = {"draft": [], "staged": [], "armed": [], "active": [], "expired": [], "failed": []}
    for intent in all_intents:
        status = intent.get("lifecycle_status", "draft")
        if status in pipeline:
            pipeline[status].append(intent)
    return pipeline


async def delete_intent(intent_id: str):
    db = await get_db()
    await db.execute("DELETE FROM staged_intents WHERE id=?", (intent_id,))
    await db.commit()
    _intents.pop(intent_id, None)
