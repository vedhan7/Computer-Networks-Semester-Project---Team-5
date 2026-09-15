"""
CASH Healing Engine — executes strategies and manages healing state.
"""
import json
import uuid
from datetime import datetime
from collections import deque
from backend.cash.matrix import get_strategy
from backend.cash.detector import detect_faults
from backend.enci.feedback import log_feedback
from backend.db.connection import get_db
from backend.network.simulator import clear_fault

# In-memory state
_active_faults: dict[str, dict] = {}
_healing_log: deque = deque(maxlen=200)


async def run_cash(segment_scores: list[dict], erp_context) -> list[dict]:
    """Main CASH cycle: detect faults, apply strategies, log outcomes."""
    faults = detect_faults(segment_scores, erp_context)
    new_actions = []

    for fault in faults:
        fault_key = fault["segment_id"]
        # Skip if already actively healing this segment
        if fault_key in _active_faults:
            continue

        _active_faults[fault_key] = fault
        activity = fault["activity_context"]
        strategy = get_strategy(fault["fault_type"], activity)

        action = {
            "id": str(uuid.uuid4()),
            "fault_id": fault["id"],
            "fault_type": fault["fault_type"],
            "severity": fault["severity"],
            "segment_id": fault_key,
            "activity_context": activity,
            "strategy_name": strategy.name,
            "aggression": strategy.aggression,
            "steps": strategy.steps,
            "description": strategy.description,
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "resolved_at": None,
        }

        # Apply healing (simulated)
        if fault["fault_type"] == "link_saturation":
            clear_fault(fault_key)  # remove injected fault if any

        # ERP feedback for critical exam events
        if strategy.erp_feedback and erp_context.active_event:
            await log_feedback(
                "network_incident",
                erp_context.active_event.id,
                f"CASH triggered '{strategy.name}' on segment '{fault_key}' during "
                f"{activity} — {fault['fault_type']} detected. CNHS: {fault['cnhs_at_detection']:.1f}",
                "critical" if fault["severity"] == "critical" else "warning",
            )

        # Persist to DB
        db = await get_db()
        await db.execute(
            """INSERT INTO healing_log
               (id, fault_type, fault_severity, segment_id, context,
                strategy_name, steps_json, success, timestamp)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (action["id"], fault["fault_type"], fault["severity"], fault_key,
             activity, strategy.name, json.dumps(strategy.steps), 1,
             action["timestamp"]),
        )
        await db.commit()

        _healing_log.appendleft(action)
        new_actions.append(action)

        # Schedule automatic fault resolution (mark resolved after strategy aggression × 10s)
        if strategy.rollback_on_resolve:
            import asyncio
            asyncio.create_task(_auto_resolve(fault_key, action["id"], strategy.aggression * 10))

    return new_actions


async def _auto_resolve(segment_id: str, action_id: str, delay_seconds: float):
    import asyncio
    await asyncio.sleep(delay_seconds)
    _active_faults.pop(segment_id, None)
    # Update resolved_at in log
    for entry in _healing_log:
        if entry["id"] == action_id:
            entry["resolved_at"] = datetime.now().isoformat()
    db = await get_db()
    await db.execute(
        "UPDATE healing_log SET resolution_seconds=? WHERE id=?",
        (delay_seconds, action_id),
    )
    await db.commit()


def get_healing_log(limit: int = 50) -> list[dict]:
    return list(_healing_log)[:limit]


def get_active_faults() -> list[dict]:
    return list(_active_faults.values())
