"""
TIPS Lifecycle Manager — 4-phase intent state machine.
Novel Contribution #3: DRAFT → STAGED → ARMED → ACTIVE → EXPIRED
"""
from datetime import datetime, timedelta
from backend.erp.service import get_events_in_window, get_active_event
from backend.enci.generator import generate_intents_for_event
from backend.apcr.resolver import detect_conflicts, resolve_conflicts, log_resolution
from backend.tips.store import (
    store_intent, update_status, get_all_intents, get_active_intents
)
from backend.config import TIPS_STAGE_MINUTES_BEFORE, TIPS_ARM_MINUTES_BEFORE


async def run_tips_scheduler():
    """
    Called every TIPS_SCHEDULER_INTERVAL_SECONDS.
    Evaluates upcoming ERP events and advances intents through lifecycle phases.
    """
    now = datetime.now()
    stage_window = now + timedelta(minutes=TIPS_STAGE_MINUTES_BEFORE)
    arm_window = now + timedelta(minutes=TIPS_ARM_MINUTES_BEFORE)

    # Get upcoming events
    upcoming = await get_events_in_window(now, stage_window)

    # Get existing intents to check for conflicts
    active_intents = await get_active_intents()
    all_intents = await get_all_intents()

    # Track ERP event IDs already in the system
    existing_erp_ids = {i["erp_event_id"] for i in all_intents if i.get("erp_event_id")}

    for event in upcoming:
        # Only generate intents once per event
        if event.id not in existing_erp_ids:
            generated = generate_intents_for_event(event)
            for intent in generated:
                # APCR conflict check before staging
                conflicts = detect_conflicts(intent, active_intents)
                resolution = resolve_conflicts(intent, conflicts, active_intents)
                if resolution["resolution_action"] != "no_conflict":
                    await log_resolution(resolution)
                    intent["apcr_conflict"] = str(conflicts)
                    intent["apcr_resolution"] = resolution["resolution_action"]

                intent["lifecycle_status"] = "draft"
                await store_intent(intent)

    # Advance: DRAFT → STAGED (T-30 min)
    all_intents = await get_all_intents()
    for intent in all_intents:
        if intent["lifecycle_status"] != "draft":
            continue
        erp_event_id = intent.get("erp_event_id")
        if erp_event_id:
            events = await get_events_in_window(now, stage_window)
            matching = [e for e in events if e.id == erp_event_id]
            if matching:
                await update_status(intent["id"], "staged", "stage_time")

    # Advance: STAGED → ARMED (T-5 min)
    all_intents = await get_all_intents()
    for intent in all_intents:
        if intent["lifecycle_status"] != "staged":
            continue
        erp_event_id = intent.get("erp_event_id")
        if erp_event_id:
            events = await get_events_in_window(now, arm_window)
            matching = [e for e in events if e.id == erp_event_id]
            if matching:
                await update_status(intent["id"], "armed", "arm_time")

    # Advance: ARMED → ACTIVE (T=0, event has started)
    all_intents = await get_all_intents()
    for intent in all_intents:
        if intent["lifecycle_status"] != "armed":
            continue
        erp_event_id = intent.get("erp_event_id")
        if erp_event_id:
            active_event = await get_active_event(now)
            if active_event and active_event.id == erp_event_id:
                await update_status(intent["id"], "active", "activate_time")

    # Advance: ACTIVE → EXPIRED (event has ended)
    all_intents = await get_all_intents()
    for intent in all_intents:
        if intent["lifecycle_status"] != "active":
            continue
        erp_event_id = intent.get("erp_event_id")
        if erp_event_id:
            # Check if any active ERP event matches
            active_event = await get_active_event(now)
            if not active_event or active_event.id != erp_event_id:
                await update_status(intent["id"], "expired", "expire_time")
