import uuid, json, re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.auth.middleware import require_auth, require_admin
from backend.tips.store import get_all_intents, store_intent, update_status, delete_intent, get_active_intents, get_tips_pipeline
from backend.apcr.resolver import detect_conflicts, resolve_conflicts, log_resolution
from backend.config import ACADEMIC_PRIORITY, SEGMENTS

router = APIRouter(prefix="/api/intents", tags=["intents"])


class CreateIntentRequest(BaseModel):
    raw_text: str


def parse_intent(raw_text: str) -> dict:
    """Simple rule-based NLP parser for manual intents."""
    text = raw_text.lower().strip()
    action = "allocate"
    if any(w in text for w in ["block", "deny", "restrict", "ban"]):
        action = "block"
    elif any(w in text for w in ["throttle", "limit", "cap", "slow"]):
        action = "throttle"
    elif any(w in text for w in ["lockdown", "lock down", "exam mode", "secure"]):
        action = "lockdown"
    elif any(w in text for w in ["prioritize", "priority", "boost", "qos"]):
        action = "prioritize"

    # Extract bandwidth
    bw_match = re.search(r"(\d+)\s*(?:mbps|mb/s|mbit)", text)
    bandwidth_mbps = int(bw_match.group(1)) if bw_match else None

    # Detect segments
    target_segments = []
    for seg_id in SEGMENTS:
        if seg_id.replace("_", " ") in text or seg_id in text:
            target_segments.append(seg_id)
    if not target_segments:
        target_segments = list(SEGMENTS.keys())  # default: all

    # Detect priority from event type keywords
    priority = 30
    for event_type, prio in ACADEMIC_PRIORITY.items():
        if event_type.replace("_", " ") in text:
            priority = prio
            break
    if "exam" in text:
        priority = 100
    elif "lab" in text:
        priority = 70
    elif "lecture" in text:
        priority = 60

    confidence = 0.85 if bw_match else 0.65

    return {
        "action": action,
        "target_services": [],
        "target_segments": target_segments,
        "bandwidth_mbps": bandwidth_mbps,
        "priority": priority,
        "confidence": confidence,
    }


@router.get("")
async def list_intents(user: dict = Depends(require_auth)):
    return await get_all_intents()


@router.post("")
async def create_intent(req: CreateIntentRequest, user: dict = Depends(require_admin)):
    parsed = parse_intent(req.raw_text)
    intent = {
        "id": str(uuid.uuid4()),
        "source": "ADMIN_MANUAL",
        "raw_text": req.raw_text,
        **parsed,
        "lifecycle_status": "draft",
    }
    # APCR check
    active = await get_active_intents()
    conflicts = detect_conflicts(intent, active)
    resolution = resolve_conflicts(intent, conflicts, active)
    if resolution["resolution_action"] != "no_conflict":
        await log_resolution(resolution)
        intent["apcr_conflict"] = str(conflicts)
        intent["apcr_resolution"] = resolution["resolution_action"]

    intent_id = await store_intent(intent)
    return {"id": intent_id, "parsed": parsed, "apcr": resolution}


@router.get("/pipeline")
async def tips_pipeline(user: dict = Depends(require_auth)):
    return await get_tips_pipeline()


@router.put("/{intent_id}/activate")
async def activate(intent_id: str, user: dict = Depends(require_admin)):
    await update_status(intent_id, "active", "activate_time")
    return {"status": "activated"}


@router.put("/{intent_id}/deactivate")
async def deactivate(intent_id: str, user: dict = Depends(require_admin)):
    await update_status(intent_id, "expired", "expire_time")
    return {"status": "deactivated"}


@router.delete("/{intent_id}")
async def remove_intent(intent_id: str, user: dict = Depends(require_admin)):
    await delete_intent(intent_id)
    return {"status": "deleted"}
