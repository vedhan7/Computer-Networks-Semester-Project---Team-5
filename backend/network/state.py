"""
Network State Manager — holds live state and rolling history.
"""
import json
from datetime import datetime
from collections import deque
from backend.config import SEGMENTS
from backend.erp.models import ERPContext
from backend.network.simulator import compute_segment_metrics, tick
from backend.db.connection import get_db

# Rolling history: last 60 ticks (2 minutes at 2s cadence)
_history: dict[str, deque] = {seg_id: deque(maxlen=60) for seg_id in SEGMENTS}
_latest_snapshot: dict = {}


async def update_state(erp_context: ERPContext) -> dict:
    """Called every 2 seconds by background task."""
    tick()
    segments = []
    for seg_id in SEGMENTS:
        metrics = compute_segment_metrics(seg_id, erp_context)
        util = metrics.get("utilization_percent", 0)
        _history[seg_id].append(util)
        metrics["history"] = list(_history[seg_id])
        segments.append(metrics)

    snapshot = {
        "timestamp": datetime.now().isoformat(),
        "segments": segments,
        "erp_context": erp_context.model_dump(mode="json"),
    }
    global _latest_snapshot
    _latest_snapshot = snapshot

    # Persist every 5th snapshot to DB (reduce write load)
    from backend.network.simulator import _tick
    if _tick % 5 == 0:
        db = await get_db()
        await db.execute(
            "INSERT INTO network_snapshots (snapshot_json, timestamp) VALUES (?, ?)",
            (json.dumps({"segments": segments}), snapshot["timestamp"]),
        )
        # Keep only last 300 snapshots (10 minutes)
        await db.execute(
            "DELETE FROM network_snapshots WHERE id NOT IN (SELECT id FROM network_snapshots ORDER BY id DESC LIMIT 300)"
        )
        await db.commit()

    return snapshot


def get_latest_snapshot() -> dict:
    return _latest_snapshot


def get_segment_history(segment_id: str) -> list[float]:
    return list(_history.get(segment_id, deque()))


async def get_history_snapshots(limit: int = 30) -> list[dict]:
    db = await get_db()
    cursor = await db.execute(
        "SELECT * FROM network_snapshots ORDER BY id DESC LIMIT ?", (limit,)
    )
    rows = await cursor.fetchall()
    return [{"timestamp": r["timestamp"], **json.loads(r["snapshot_json"])} for r in reversed(rows)]
